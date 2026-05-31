import { prisma } from '@/prisma/client'

class AdminStatsService {
  async getOverviewStats() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Current period (30 days)
    const currentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const currentTotal = currentOrders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    )

    // Previous period (30 days)
    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    })

    const previousTotal = previousOrders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    )

    const salesChange =
      previousTotal === 0
        ? 100
        : ((currentTotal - previousTotal) / previousTotal) * 100

    const currentOrdersCount = currentOrders.length
    const previousOrdersCount = previousOrders.length
    const ordersChange =
      previousOrdersCount === 0
        ? 100
        : ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100

    // Active customers (last 30 days)
    const activeCustomers = await prisma.order.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: thirtyDaysAgo } }
    })

    // Low stock products
    const lowStockCount = await prisma.product.count({
      where: { stock: { lt: 5 } }
    })

    return {
      totalSales: parseFloat(currentTotal.toFixed(2)),
      salesChange: parseFloat(salesChange.toFixed(1)),
      totalOrders: currentOrdersCount,
      ordersChange: parseFloat(ordersChange.toFixed(1)),
      activeCustomers: activeCustomers.length,
      lowStockProducts: lowStockCount
    }
  }

  async getSalesChart(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const dailySales: Record<string, number> = {}

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailySales[dateStr] = 0
    }

    orders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0]
      const amount = parseFloat(order.total.toString())
      dailySales[dateStr] = (dailySales[dateStr] || 0) + amount
    })

    return Object.entries(dailySales).map(([date, sales]) => ({
      date,
      sales: parseFloat(sales.toFixed(2))
    }))
  }

  async getRevenueByCategory() {
    const result = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        price: true
      }
    })

    const categoryRevenue: Record<string, number> = {}

    for (const item of result) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { category: { select: { name: true } } }
      })

      if (product?.category) {
        categoryRevenue[product.category.name] =
          (categoryRevenue[product.category.name] || 0) +
          parseFloat((item._sum.price || 0).toString())
      }
    }

    return Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }))
  }

  async getTopProducts(limit: number = 5) {
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        qty: true
      },
      orderBy: {
        _sum: {
          qty: 'desc'
        }
      },
      take: limit
    })

    const result = []

    for (const item of topProducts) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (product) {
        result.push({
          name: product.name,
          quantity: item._sum.qty || 0
        })
      }
    }

    return result
  }

  async getOrdersStatus() {
    const statuses = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    })

    return statuses.map(s => ({
      name: this.translateStatus(s.status),
      value: s._count
    }))
  }

  async getChannelBreakdown() {
    const orders = await prisma.order.groupBy({
      by: ['channel'],
      _count: { _all: true },
      _sum: { total: true },
    })
    return orders.map(o => ({
      channel: o.channel,
      orderCount: o._count._all,
      total: Number(o._sum.total ?? 0),
    }))
  }

  async getPaymentMethodBreakdown() {
    const orders = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: { _all: true },
      _sum: { total: true },
    })
    return orders.map(o => ({
      paymentMethod: o.paymentMethod,
      orderCount: o._count._all,
      total: Number(o._sum.total ?? 0),
    }))
  }

  async getInventoryAlerts() {
    const products = await prisma.product.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: 'asc' },
      take: 20,
    })
    const supplies = await prisma.supply.findMany({
      include: { category: true },
    })
    const lowSupplies = supplies
      .filter(s => Number(s.currentStock) <= Number(s.minStock))
      .map(s => ({
        id: s.id,
        name: s.name,
        currentStock: Number(s.currentStock),
        minStock: Number(s.minStock),
        unit: s.unit,
        category: s.category.name,
      }))
    return { products, supplies: lowSupplies }
  }

  async getOperationalCosts(daysBack = 30) {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    const movs = await prisma.supplyMovement.findMany({
      where: { type: 'in', createdAt: { gte: since } },
    })
    const total = movs.reduce((s, m) => s + Number(m.totalCost ?? 0), 0)
    return { total, count: movs.length, daysBack }
  }

  async getCustomerMetrics(daysBack = 30) {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    const [newCustomers, allOrders] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: { userId: true, total: true },
      }),
    ])
    const ticketAverage = allOrders.length > 0
      ? allOrders.reduce((s, o) => s + Number(o.total), 0) / allOrders.length
      : 0
    const usersWithOrders = new Set(allOrders.filter(o => o.userId).map(o => o.userId))
    return {
      newCustomers,
      ticketAverage,
      ordersInPeriod: allOrders.length,
      uniqueCustomers: usersWithOrders.size,
    }
  }

  async getAdvancedAnalytics(daysBack = 30) {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

    const [
      totalProducts,
      activeProducts,
      orders,
      topProducts,
      topCustomers,
      supplyCosts,
      newUsers,
      activeCustomerGroups,
      ordersByNeighborhood,
      neighborhoods,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: {
          id: true,
          total: true,
          paymentStatus: true,
          status: true,
          neighborhoodId: true,
          customerName: true,
          customerEmail: true,
          userId: true,
          createdAt: true,
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { qty: true },
        orderBy: { _sum: { qty: 'desc' } },
        take: 10,
      }),
      prisma.order.groupBy({
        by: ['customerEmail', 'customerName', 'userId'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
      prisma.supplyMovement.findMany({
        where: { type: 'in', createdAt: { gte: since } },
        select: { totalCost: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.order.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: since }, userId: { not: null } },
      }),
      prisma.order.groupBy({
        by: ['neighborhoodId'],
        where: { createdAt: { gte: since }, neighborhoodId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { neighborhoodId: 'desc' } },
        take: 10,
      }),
      prisma.neighborhood.findMany({
        select: {
          id: true,
          name: true,
          city: { select: { name: true } },
        },
      }),
    ])

    const productMap = new Map<number, string>()
    if (topProducts.length > 0) {
      const ids = topProducts.map((p) => p.productId)
      const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      products.forEach((p) => productMap.set(p.id, p.name))
    }

    const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0)
    const cost = supplyCosts.reduce((sum, s) => sum + Number(s.totalCost ?? 0), 0)
    const profit = revenue - cost

    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid').length
    const avgTicket = orders.length ? revenue / orders.length : 0

    const topProductsFormatted = topProducts.map((p) => ({
      productId: p.productId,
      name: productMap.get(p.productId) || `Produto #${p.productId}`,
      qty: p._sum.qty || 0,
    }))

    const neighborhoodMap = new Map(neighborhoods.map((n) => [n.id, n]))
    const topNeighborhoods = ordersByNeighborhood.map((row) => {
      const nb = neighborhoodMap.get(row.neighborhoodId as number)
      return {
        id: row.neighborhoodId,
        neighborhood: nb?.name || `Bairro #${row.neighborhoodId}`,
        city: nb?.city.name || 'N/A',
        orders: row._count._all,
      }
    })

    return {
      periodDays: daysBack,
      kpis: {
        totalProducts,
        activeProducts,
        orders: orders.length,
        deliveredOrders,
        paidOrders,
        avgTicket: Number(avgTicket.toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
        cost: Number(cost.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        marginPct: revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0,
      },
      topViewedProducts: topProductsFormatted,
      topSearchedTerms: topProductsFormatted.map((p) => ({ term: p.name, hits: p.qty })),
      topCustomers: topCustomers.map((c) => ({
        name: c.customerName || 'Cliente',
        email: c.customerEmail,
        userId: c.userId,
        orders: c._count._all,
        spent: Number(c._sum.total ?? 0),
      })),
      geography: {
        topNeighborhoods,
      },
      loginMetrics: {
        trackingEnabled: false,
        note: 'Rastreamento detalhado de login ainda não está habilitado no backend.',
        newUsers,
        activeCustomers: activeCustomerGroups.length,
      },
    }
  }

  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    }
    return map[status] || status
  }
}

export const adminStatsService = new AdminStatsService()
