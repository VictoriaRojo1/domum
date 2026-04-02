const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Get aggregated dashboard statistics
 */
router.get('/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Dates for upcoming events (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Execute all queries in parallel
    const [
      // Properties stats
      totalProperties,
      availableProperties,

      // Leads stats
      totalLeads,
      activeLeads,
      leadsByStage,
      recentLeads,

      // Events stats
      scheduledVisits,
      upcomingEvents,

      // Transactions stats (this month)
      monthlyIncome,
      monthlyExpenses,

      // Rentals stats
      activeRentals,
      expiringRentals
    ] = await Promise.all([
      // Properties
      prisma.property.count(),
      prisma.property.count({ where: { status: 'DISPONIBLE' } }),

      // Leads
      prisma.lead.count(),
      prisma.lead.count({
        where: {
          stage: { notIn: ['CERRADO', 'PERDIDO'] }
        }
      }),
      prisma.lead.groupBy({
        by: ['stage'],
        _count: { id: true }
      }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true } },
          property: { select: { id: true, title: true } }
        }
      }),

      // Events - scheduled visits
      prisma.event.count({
        where: {
          type: 'VISITA',
          status: 'PENDIENTE',
          date: { gte: today }
        }
      }),
      prisma.event.findMany({
        where: {
          date: { gte: today, lte: nextWeek },
          status: { in: ['PENDIENTE', 'CONFIRMADO'] }
        },
        take: 5,
        orderBy: { date: 'asc' },
        include: {
          property: { select: { id: true, title: true, address: true } },
          lead: { select: { id: true, name: true } },
          agent: { select: { id: true, name: true } }
        }
      }),

      // Transactions - monthly income
      prisma.transaction.aggregate({
        where: {
          type: 'INGRESO',
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'EGRESO',
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      }),

      // Rentals
      prisma.rental.count({ where: { status: 'ACTIVO' } }),
      prisma.rental.count({
        where: {
          status: 'ACTIVO',
          endDate: {
            gte: today,
            lte: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Transform leads by stage to object
    const pipelineStats = {};
    leadsByStage.forEach(item => {
      pipelineStats[item.stage.toLowerCase()] = item._count.id;
    });

    // Transform recent leads
    const transformedRecentLeads = recentLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      stage: lead.stage.toLowerCase(),
      source: lead.source.toLowerCase(),
      score: lead.score,
      property: lead.property ? {
        id: lead.property.id,
        title: lead.property.title
      } : null,
      assignedTo: lead.assignedTo ? {
        id: lead.assignedTo.id,
        name: lead.assignedTo.name
      } : null,
      createdAt: lead.createdAt
    }));

    // Transform upcoming events
    const transformedEvents = upcomingEvents.map(event => ({
      id: event.id,
      type: event.type.toLowerCase(),
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      status: event.status.toLowerCase(),
      property: event.property ? {
        id: event.property.id,
        title: event.property.title,
        address: event.property.address
      } : null,
      lead: event.lead ? {
        id: event.lead.id,
        name: event.lead.name
      } : null,
      agent: event.agent ? {
        id: event.agent.id,
        name: event.agent.name
      } : null
    }));

    res.json({
      stats: {
        // Properties
        totalProperties,
        availableProperties,

        // Leads
        totalLeads,
        activeLeads,
        pipelineStats,

        // Events
        scheduledVisits,

        // Transactions
        monthIncome: monthlyIncome._sum.amount ? parseFloat(monthlyIncome._sum.amount) : 0,
        monthExpenses: monthlyExpenses._sum.amount ? parseFloat(monthlyExpenses._sum.amount) : 0,

        // Rentals
        activeRentals,
        expiringRentals
      },
      recentLeads: transformedRecentLeads,
      upcomingEvents: transformedEvents
    });
  })
);

/**
 * GET /api/dashboard/quick-stats
 * Get minimal stats for header/sidebar
 */
router.get('/quick-stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const today = new Date();

    const [
      pendingLeads,
      todayEvents,
      pendingTasks
    ] = await Promise.all([
      prisma.lead.count({
        where: { stage: 'NUEVO' }
      }),
      prisma.event.count({
        where: {
          date: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lt: new Date(today.setHours(23, 59, 59, 999))
          },
          status: { in: ['PENDIENTE', 'CONFIRMADO'] }
        }
      }),
      prisma.event.count({
        where: {
          status: 'PENDIENTE',
          date: { lte: today }
        }
      })
    ]);

    res.json({
      pendingLeads,
      todayEvents,
      pendingTasks
    });
  })
);

module.exports = router;
