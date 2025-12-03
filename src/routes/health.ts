import { Router } from 'express';
import { sequelize } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check database connection
    await sequelize.authenticate();

    // Check database responsiveness
    await sequelize.query('SELECT 1');

    const responseTime = Date.now() - startTime;

    // Get package info
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf8')
    );

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      version: packageJson.version,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        dialect: 'mariadb',
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
      endpoints: {
        auth: '/api/auth',
        products: '/api/products',
        cart: '/api/cart',
        orders: '/api/orders',
        admin: '/api/admin',
      },
    };

    res.status(200).json(healthData);
  } catch (error) {
    const responseTime = Date.now() - startTime;

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'disconnected',
      },
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    await sequelize.authenticate();

    // Get database stats
    const [results] = await sequelize.query(`
      SELECT 
        table_name as tableName,
        table_rows as tableCount
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        dialect: 'mariadb',
        tables: results,
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
