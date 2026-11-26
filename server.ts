import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
} from './src/data/catalog.ts';
import type { PlacedOrder, ProductItem } from './src/data/catalog.ts';
import {
  clampString,
  createAuthMiddlewares,
  hasConfiguredAdminPasscode,
  isSafeImageUrl,
  isValidEmail,
  issueSessionToken,
  revokeSessionToken,
  verifyConfiguredAdminPasscode,
} from './server/auth.ts';
import type { AuthenticatedRequest, UserRole } from './server/auth.ts';
import { dataStore } from './server/supabase.ts';

const PORT = 3000;
const VALID_ORDER_STATUSES: PlacedOrder['status'][] = [
  'Confirmed',
  'Packing',
  'Dispatched',
  'Delivered',
  'Cancelled',
];
const VALID_SECTIONS: ProductItem['section'][] = [
  'new-arrivals',
  'branded-ready-to-wear',
  'catalog',
];

function asyncRoute(
  handler: (req: AuthenticatedRequest, res: express.Response) => Promise<void>
): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as AuthenticatedRequest, res)).catch((err) => {
      console.error('API route error:', err instanceof Error ? err.message : 'Unknown error');
      if (!res.headersSent) {
        res.status(500).json({ error: 'Server error while processing your request.' });
      } else {
        next(err);
      }
    });
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  const { authenticateOptional, requireAuth, requireAdmin } = createAuthMiddlewares(async (id) => {
    const user = await dataStore.findUserById(id);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  });

  /* ==========================================================================
   * AUTHENTICATION ROUTES
   * ======================================================================== */

  app.get(
    '/api/auth/status',
    asyncRoute(async (_req, res) => {
      const hasAdminAccount = (await dataStore.countAdmins()) > 0;
      const hasEnvPasscode = hasConfiguredAdminPasscode();
      res.json({
        hasAdminAccount,
        hasEnvPasscode,
        needsAdminSetup: !hasAdminAccount && !hasEnvPasscode,
      });
    })
  );

  app.post(
    '/api/auth/admin-setup',
    asyncRoute(async (req, res) => {
      if (hasConfiguredAdminPasscode()) {
        res.status(403).json({
          error: 'Admin passcode is configured on the server. Use Admin Passcode Sign In.',
        });
        return;
      }

      const name = clampString(req.body?.name, 80);
      const email = clampString(req.body?.email, 120).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (name.length < 2) {
        res.status(400).json({ error: 'Please enter the store owner name (min 2 characters).' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Please enter a valid admin email address.' });
        return;
      }
      if (password.length < 8 || password.length > 128) {
        res.status(400).json({ error: 'Admin password must be between 8 and 128 characters.' });
        return;
      }

      const result = await dataStore.claimInitialAdmin({ name, email, password });
      if (!result.user) {
        res.status(result.status ?? 409).json({
          error: result.error || 'Unable to complete initial admin setup.',
        });
        return;
      }

      const token = issueSessionToken({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: 'admin',
      });
      res.status(201).json({ token, user: result.user });
    })
  );

  app.post('/api/auth/admin-passcode', (req, res) => {
    if (!hasConfiguredAdminPasscode()) {
      res.status(400).json({ error: 'Server admin passcode is not configured.' });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    if (!verifyConfiguredAdminPasscode(passcode)) {
      res.status(401).json({ error: 'Invalid admin passcode.' });
      return;
    }

    const adminProfile = {
      id: 'env-admin',
      name: 'Rooznam Admin',
      email: 'ahmadmail59268@gmail.com',
      phone: '+92 332 6109729',
      city: 'Lahore',
      address: '',
      role: 'admin' as const,
      createdAt: 'Active',
    };
    const token = issueSessionToken({
      id: adminProfile.id,
      name: adminProfile.name,
      email: adminProfile.email,
      role: 'admin',
      isPasscodeAdmin: true,
    });
    res.json({ token, user: adminProfile });
  });

  app.post(
    '/api/auth/signup',
    asyncRoute(async (req, res) => {
      const name = clampString(req.body?.name, 80);
      const email = clampString(req.body?.email, 120).toLowerCase();
      const phone = clampString(req.body?.phone, 30);
      const city = clampString(req.body?.city, 60) || 'Lahore';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (name.length < 2) {
        res.status(400).json({ error: 'Please enter your full name.' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      if (password.length < 6 || password.length > 128) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
      }

      const result = await dataStore.registerCustomer({ name, email, phone, city, password });
      if (!result.user) {
        res.status(result.status ?? 400).json({
          error: result.error || 'Unable to create account.',
        });
        return;
      }

      const token = issueSessionToken({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      });
      res.status(201).json({ token, user: result.user });
    })
  );

  app.post(
    '/api/auth/login',
    asyncRoute(async (req, res) => {
      const email = clampString(req.body?.email, 120).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!isValidEmail(email) || !password) {
        res.status(400).json({ error: 'Please enter both email and password.' });
        return;
      }

      const safeUser = await dataStore.authenticateUser(email, password);
      if (!safeUser) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = issueSessionToken({
        id: safeUser.id,
        name: safeUser.name,
        email: safeUser.email,
        role: safeUser.role,
      });
      res.json({ token, user: safeUser });
    })
  );

  app.get(
    '/api/auth/me',
    requireAuth,
    asyncRoute(async (req, res) => {
      const session = req.authUser!;
      if (session.isPasscodeAdmin) {
        res.json({
          user: {
            id: session.id,
            name: session.name,
            email: session.email,
            phone: '+92 332 6109729',
            city: 'Lahore',
            address: '',
            role: 'admin',
            createdAt: 'Active',
          },
        });
        return;
      }
      const dbUser = await dataStore.findUserById(session.id);
      if (!dbUser) {
        res.status(401).json({ error: 'Session user not found.' });
        return;
      }
      res.json({ user: dbUser });
    })
  );

  app.post('/api/auth/logout', authenticateOptional, (req: AuthenticatedRequest, res) => {
    if (req.authToken) {
      revokeSessionToken(req.authToken);
    }
    res.json({ ok: true });
  });

  /* ==========================================================================
   * CUSTOMER ACCOUNT ROUTES
   * ======================================================================== */

  app.patch(
    '/api/my/profile',
    requireAuth,
    asyncRoute(async (req, res) => {
      const session = req.authUser!;
      if (session.isPasscodeAdmin) {
        res.status(400).json({ error: 'Passcode admin profile cannot be edited here.' });
        return;
      }
      const name = clampString(req.body?.name, 80);
      const phone = clampString(req.body?.phone, 30);
      const city = clampString(req.body?.city, 60) || 'Lahore';
      const address = clampString(req.body?.address, 260);

      if (name.length < 2) {
        res.status(400).json({ error: 'Name must be at least 2 characters.' });
        return;
      }
      const updated = await dataStore.updateUserProfile(session.id, { name, phone, city, address });
      res.json({ user: updated });
    })
  );

  app.get(
    '/api/my/orders',
    requireAuth,
    asyncRoute(async (req, res) => {
      const session = req.authUser!;
      const orders = await dataStore.listOrdersByUser(session.id);
      res.json({ orders });
    })
  );

  /* ==========================================================================
   * PUBLIC STOREFRONT ROUTES
   * ======================================================================== */

  app.get(
    '/api/products',
    asyncRoute(async (_req, res) => {
      const products = await dataStore.listProducts(false);
      res.json({ products });
    })
  );

  app.post(
    '/api/orders',
    authenticateOptional,
    asyncRoute(async (req, res) => {
      const customerName = clampString(req.body?.customerName, 100);
      const phone = clampString(req.body?.phone, 30);
      const city = clampString(req.body?.city, 60);
      const address = clampString(req.body?.address, 300);
      const notes = clampString(req.body?.notes, 240);
      const paymentMethod =
        req.body?.paymentMethod === 'WhatsAppTransfer' ? 'WhatsAppTransfer' : 'COD';
      const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

      if (!customerName || !phone || !city || !address) {
        res.status(400).json({ error: 'Please complete all required delivery details.' });
        return;
      }
      if (rawItems.length === 0 || rawItems.length > 30) {
        res.status(400).json({ error: 'Your cart must contain between 1 and 30 items.' });
        return;
      }

      const validatedItems: PlacedOrder['items'] = [];
      for (const raw of rawItems) {
        const productId = clampString(raw?.productId, 80);
        const size = clampString(raw?.size, 30) || '4-5 Yrs';
        const qty = Math.min(20, Math.max(1, Math.floor(Number(raw?.quantity) || 1)));

        const catalogProd = await dataStore.getProductById(productId);
        if (catalogProd) {
          validatedItems.push({
            productId: catalogProd.id,
            title: catalogProd.title,
            size,
            quantity: qty,
            price: catalogProd.price,
            image: catalogProd.image,
          });
        } else if (productId.startsWith('custom-')) {
          const title = clampString(raw?.title, 160) || 'Customized Suit';
          const price = Math.min(15000, Math.max(2500, Math.round(Number(raw?.price) || 3850)));
          const image = isSafeImageUrl(String(raw?.image ?? ''))
            ? String(raw.image).trim()
            : '/src/assets/images/rooznam_hero_girls_1795673372537.jpg';
          validatedItems.push({
            productId,
            title,
            size,
            quantity: qty,
            price,
            image,
          });
        } else {
          res.status(400).json({ error: `Product "${productId}" is no longer available.` });
          return;
        }
      }

      const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
      const total = subtotal + shippingFee;

      const order = await dataStore.createOrder({
        userId: req.authUser?.id ?? null,
        customerName,
        phone,
        city,
        address,
        notes: notes || undefined,
        paymentMethod,
        items: validatedItems,
        subtotal,
        shippingFee,
        total,
      });

      res.status(201).json({ order });
    })
  );

  app.get(
    '/api/orders/track/:orderId',
    asyncRoute(async (req, res) => {
      const orderId = clampString(req.params.orderId, 40);
      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required.' });
        return;
      }
      const order = await dataStore.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      const firstName = order.customerName.split(' ')[0] || 'Customer';
      res.json({
        order: {
          orderId: order.orderId,
          createdAt: order.createdAt,
          customerName: firstName,
          city: order.city,
          paymentMethod: order.paymentMethod,
          items: order.items,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          total: order.total,
          status: order.status,
        },
      });
    })
  );

  app.post(
    '/api/contact',
    asyncRoute(async (req, res) => {
      const name = clampString(req.body?.name, 80);
      const phone = clampString(req.body?.phone, 30);
      const email = clampString(req.body?.email, 120);
      const message = clampString(req.body?.message, 1000);
      if (!name || !message) {
        res.status(400).json({ error: 'Name and message are required.' });
        return;
      }
      const record = await dataStore.createContactMessage({ name, phone, email, message });
      res.status(201).json({ message: record });
    })
  );

  app.post(
    '/api/newsletter',
    asyncRoute(async (req, res) => {
      const email = clampString(req.body?.email, 120);
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      const subscriber = await dataStore.addSubscriber(email);
      res.status(201).json({ subscriber });
    })
  );

  /* ==========================================================================
   * PROTECTED ADMIN DASHBOARD ROUTES
   * ======================================================================== */

  app.get(
    '/api/admin/overview',
    requireAdmin,
    asyncRoute(async (_req, res) => {
      res.json(await dataStore.getAdminOverview());
    })
  );

  app.get(
    '/api/admin/orders',
    requireAdmin,
    asyncRoute(async (_req, res) => {
      res.json({ orders: await dataStore.listAllOrders() });
    })
  );

  app.patch(
    '/api/admin/orders/:orderId/status',
    requireAdmin,
    asyncRoute(async (req, res) => {
      const orderId = clampString(req.params.orderId, 40);
      const status = String(req.body?.status ?? '') as PlacedOrder['status'];
      if (!VALID_ORDER_STATUSES.includes(status)) {
        res.status(400).json({ error: 'Invalid order status.' });
        return;
      }
      const updated = await dataStore.updateOrderStatus(orderId, status);
      if (!updated) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      res.json({ order: updated });
    })
  );

  app.delete(
    '/api/admin/orders/:orderId',
    requireAdmin,
    asyncRoute(async (req, res) => {
      const orderId = clampString(req.params.orderId, 40);
      const deleted = await dataStore.deleteOrder(orderId);
      if (!deleted) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      res.json({ ok: true });
    })
  );

  app.get(
    '/api/admin/products',
    requireAdmin,
    asyncRoute(async (_req, res) => {
      res.json({ products: await dataStore.listProducts(true) });
    })
  );

  function parseProductPayload(body: Record<string, unknown>) {
    const title = clampString(body?.title, 140);
    const price = Math.round(Number(body?.price));
    const image = clampString(body?.image, 1200);
    const rawBackImage = clampString(body?.backImage, 1200);
    const backImage = rawBackImage || undefined;
    const categoryId = clampString(body?.categoryId, 40);
    const rawSection = clampString(body?.section, 40) as ProductItem['section'];
    const section = VALID_SECTIONS.includes(rawSection) ? rawSection : 'catalog';
    const fabric = clampString(body?.fabric, 80) || 'Soft Cotton Blend';
    const fit = clampString(body?.fit, 80) || 'Regular Fit';
    const color = clampString(body?.color, 80) || 'Assorted';
    const description =
      clampString(body?.description, 600) ||
      'Comfortable child-friendly kidswear crafted for everyday smiles.';
    const badge = clampString(body?.badge, 40) || undefined;
    const stock = Math.max(0, Math.min(9999, Math.round(Number(body?.stock ?? 20))));
    const isActive = body?.isActive !== false;
    const rawSizes = Array.isArray(body?.sizes) ? body.sizes : [];
    const sizes = rawSizes
      .map((s) => clampString(s, 24))
      .filter(Boolean)
      .slice(0, 10);

    if (title.length < 3) return { error: 'Product title must be at least 3 characters.' };
    if (!Number.isFinite(price) || price < 100 || price > 250000) {
      return { error: 'Price must be between Rs 100 and Rs 250,000.' };
    }
    if (!isSafeImageUrl(image)) {
      return { error: 'Please provide a valid http(s) or local Rooznam image path.' };
    }
    if (backImage && !isSafeImageUrl(backImage)) {
      return { error: 'Back photo URL must be a valid http(s) or local Rooznam image path.' };
    }

    return {
      data: {
        title,
        price,
        image,
        backImage,
        categoryId,
        section,
        fabric,
        fit,
        color,
        description,
        badge,
        stock,
        isActive,
        sizes:
          sizes.length > 0
            ? sizes
            : ['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs', '6-7 Yrs', '7-8 Yrs'],
      },
    };
  }

  app.post(
    '/api/admin/products',
    requireAdmin,
    asyncRoute(async (req, res) => {
      const parsed = parseProductPayload((req.body ?? {}) as Record<string, unknown>);
      if ('error' in parsed) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      const product = await dataStore.createProduct(parsed.data);
      res.status(201).json({ product });
    })
  );

  app.put(
    '/api/admin/products/:id',
    requireAdmin,
    asyncRoute(async (req, res) => {
      const id = clampString(req.params.id, 60);
      const parsed = parseProductPayload((req.body ?? {}) as Record<string, unknown>);
      if ('error' in parsed) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      const product = await dataStore.updateProduct(id, parsed.data);
      if (!product) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }
      res.json({ product });
    })
  );

  app.delete(
    '/api/admin/products/:id',
    requireAdmin,
    asyncRoute(async (req, res) => {
      const id = clampString(req.params.id, 60);
      const deleted = await dataStore.deleteProduct(id);
      if (!deleted) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }
      res.json({ ok: true });
    })
  );

  app.get(
    '/api/admin/customers',
    requireAdmin,
    asyncRoute(async (_req, res) => {
      res.json({ customers: await dataStore.listUsersWithStats() });
    })
  );

  app.patch(
    '/api/admin/customers/:id/role',
    requireAdmin,
    asyncRoute(async (req, res) => {
      const targetId = clampString(req.params.id, 60);
      const nextRole = req.body?.role === 'admin' ? ('admin' as UserRole) : ('customer' as UserRole);

      const target = await dataStore.findUserById(targetId);
      if (!target) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      if (target.role === 'admin' && nextRole === 'customer' && (await dataStore.countAdmins()) <= 1) {
        res.status(400).json({ error: 'Cannot demote the last remaining admin account.' });
        return;
      }
      const updated = await dataStore.updateUserRole(targetId, nextRole);
      res.json({ customer: updated });
    })
  );

  app.get(
    '/api/admin/messages',
    requireAdmin,
    asyncRoute(async (_req, res) => {
      res.json({ messages: await dataStore.listContactMessages() });
    })
  );

  app.patch(
    '/api/admin/messages/:id',
    requireAdmin,
    asyncRoute(async (req, res) => {
      const id = clampString(req.params.id, 60);
      const status = String(req.body?.status ?? '');
      if (status !== 'New' && status !== 'Replied' && status !== 'Resolved') {
        res.status(400).json({ error: 'Invalid message status.' });
        return;
      }
      const updated = await dataStore.updateContactMessageStatus(id, status);
      if (!updated) {
        res.status(404).json({ error: 'Message not found.' });
        return;
      }
      res.json({ message: updated });
    })
  );

  app.get(
    '/api/admin/subscribers',
    requireAdmin,
    asyncRoute(async (_req, res) => {
      res.json({ subscribers: await dataStore.listSubscribers() });
    })
  );

  /* ==========================================================================
   * VITE DEV MIDDLEWARE / PRODUCTION STATIC HOSTING
   * ======================================================================== */

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src/assets/images')));
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.resolve(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Rooznam full-stack server running on http://0.0.0.0:${PORT} (storage: ${dataStore.backendName()})`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start Rooznam server:', err);
  process.exit(1);
});
