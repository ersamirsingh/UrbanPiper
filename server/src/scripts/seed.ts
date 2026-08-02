import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import connectToMongoDB from '../config/db.js';

import User from '../models/user.model.js';
import Tenant from '../models/tenant.model.js';
import Restaurant from '../models/restaurant.model.js';
import Outlet from '../models/outlet.model.js';
import Category from '../models/category.model.js';
import MenuItem from '../models/menuItem.model.js';
import Variant from '../models/variant.model.js';
import Addon from '../models/addon.model.js';
import Inventory from '../models/inventory.model.js';
import Customer from '../models/customer.model.js';
import Order from '../models/order.model.js';
import OrderItem from '../models/orderItem.model.js';
import OrderTimeline from '../models/ordertimeline.model.js';
import Payment from '../models/payment.model.js';
import DiningArea from '../models/diningarea.model.js';
import Table from '../models/table.model.js';
import Coupon from '../models/coupon.model.js';
import Notification from '../models/notification.model.js';
import AuditLog from '../models/auditLog.model.js';
import ReviewAnalytics from '../models/reviewanalytics.model.js';
import Issue from '../models/issue.model.js';
import SubscriptionPlanModel from '../models/subscriptionPlan.model.js';
import RestaurantSubscriptionModel from '../models/subscription.model.js';

import {
  UserRole,
  UserStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderSource,
  WeekDay,
  SubscriptionPlan,
  AuditAction,
  NotificationType,
  ReviewSource,
  SentimentLabel
} from '../models/enums.js';

import {
  SubscriptionStatus as SaaSStatus,
  BillingCycle,
  PaymentProvider
} from '../modules/subscription/subscription.enum.js';

const PASSWORD_PLAIN = 'TestPass@123';

const OFFLINE_SEED_SOURCES = [
  OrderSource.POS,
  OrderSource.WAITER,
  OrderSource.QR_DINE_IN,
  OrderSource.TAKEAWAY
];

const runSeed = async () => {
  try {
    console.log('Connecting to database...');
    await connectToMongoDB();
    console.log('Connected to MongoDB.');

    console.log('Clearing existing data from ALL model collections...');
    await Promise.all([
      User.deleteMany({}),
      Tenant.deleteMany({}),
      Restaurant.deleteMany({}),
      Outlet.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      Variant.deleteMany({}),
      Addon.deleteMany({}),
      Inventory.deleteMany({}),
      Customer.deleteMany({}),
      Order.deleteMany({}),
      OrderItem.deleteMany({}),
      OrderTimeline.deleteMany({}),
      Payment.deleteMany({}),
      DiningArea.deleteMany({}),
      Table.deleteMany({}),
      Coupon.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      ReviewAnalytics.deleteMany({}),
      Issue.deleteMany({}),
      SubscriptionPlanModel.deleteMany({}),
      RestaurantSubscriptionModel.deleteMany({}),
    ]);
    console.log('All collections cleared.');

    console.log('Generating password hash...');
    const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

    // 1. Subscription Plans
    console.log('Seeding Subscription Plans...');
    const superPlan = await SubscriptionPlanModel.create({
      name: 'Super Plan',
      slug: 'super',
      description: 'Enterprise features with high limits for multi-outlet operations',
      monthlyPrice: 9999,
      yearlyPrice: 99999,
      currency: 'INR',
      trialDays: 14,
      features: {
        inventory: true,
        crm: true,
        analytics: true,
        finance: true,
        kitchenDisplay: true,
        waiterApp: true,
        qrOrdering: true,
        reports: true,
        apiAccess: true,
        whiteLabel: true,
      },
      limits: {
        outlets: 100,
        employees: 1000,
        monthlyOrders: 100000,
        menuItems: 10000,
        storageGB: 100,
      },
      isActive: true,
    });

    const proPlan = await SubscriptionPlanModel.create({
      name: 'Pro Plan',
      slug: 'pro',
      description: 'Advanced features for growing single and dual-outlet restaurants',
      monthlyPrice: 4999,
      yearlyPrice: 49999,
      currency: 'INR',
      trialDays: 14,
      features: {
        inventory: true,
        crm: true,
        analytics: true,
        finance: false,
        kitchenDisplay: true,
        waiterApp: true,
        qrOrdering: true,
        reports: true,
        apiAccess: false,
        whiteLabel: false,
      },
      limits: {
        outlets: 5,
        employees: 50,
        monthlyOrders: 10000,
        menuItems: 1000,
        storageGB: 10,
      },
      isActive: true,
    });

    // 2. System Admins (2)
    console.log('Seeding 2 System Admins...');
    const sysAdmin1 = await User.create({
      firstName: 'System',
      lastName: 'Admin 1',
      email: 'systemadmin1@test.com',
      passwordHash,
      role: UserRole.SYSTEM_ADMIN,
      status: UserStatus.ACTIVE,
      invitationAccepted: true,
    });

    const sysAdmin2 = await User.create({
      firstName: 'System',
      lastName: 'Admin 2',
      email: 'systemadmin2@test.com',
      passwordHash,
      role: UserRole.SYSTEM_ADMIN,
      status: UserStatus.ACTIVE,
      invitationAccepted: true,
    });

    // 3. Tenants (2) & Tenant Super Admins (2)
    console.log('Seeding 2 Tenants & Tenant Super Admins...');
    const t1OwnerId = new Types.ObjectId();
    const tenant1 = await Tenant.create({
      name: 'OmniServe Prime Tenant',
      slug: 'omniserve-prime',
      ownerId: t1OwnerId,
      subscriptionPlan: SubscriptionPlan.SUPER,
      status: UserStatus.ACTIVE,
      createdBy: sysAdmin1._id,
    });

    const tenantAdmin1 = await User.create({
      _id: t1OwnerId,
      tenantId: tenant1._id,
      firstName: 'Tenant',
      lastName: 'Admin 1',
      email: 'tenantadmin1@test.com',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      invitationAccepted: true,
      createdBy: sysAdmin1._id,
    });

    const t2OwnerId = new Types.ObjectId();
    const tenant2 = await Tenant.create({
      name: 'OmniServe Express Tenant',
      slug: 'omniserve-express',
      ownerId: t2OwnerId,
      subscriptionPlan: SubscriptionPlan.PRO,
      status: UserStatus.ACTIVE,
      createdBy: sysAdmin2._id,
    });

    const tenantAdmin2 = await User.create({
      _id: t2OwnerId,
      tenantId: tenant2._id,
      firstName: 'Tenant',
      lastName: 'Admin 2',
      email: 'tenantadmin2@test.com',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      invitationAccepted: true,
      createdBy: sysAdmin2._id,
    });

    // 4. Customers (30)
    console.log('Seeding Customer Pool...');
    const customersData = Array.from({ length: 30 }).map((_, i) => {
      const idx = i + 1;
      const targetTenant = idx % 2 === 0 ? tenant1 : tenant2;
      return {
        tenantId: targetTenant._id,
        firstName: `Customer`,
        lastName: `${idx}`,
        email: `customer${idx}@test.com`,
        phone: `+9198765${10000 + idx}`,
        address: [
          {
            label: 'Home',
            line1: `${idx * 15} Connaught Place`,
            city: 'Metropolis',
            state: 'State',
            pincode: '400001',
            location: { type: 'Point', coordinates: [77.2090 + (idx * 0.001), 28.6139 + (idx * 0.001)] },
            isDefault: true,
          },
        ],
        totalOrders: 0,
        totalSpent: 0,
        createdBy: targetTenant._id.equals(tenant1._id) ? tenantAdmin1._id : tenantAdmin2._id,
      };
    });
    const customers = await Customer.insertMany(customersData);

    // 5. Restaurants (4), Outlets (10), Managers (10), Staff (30)
    const restaurantConfigs = [
      { name: 'Royal Spice Kitchen', tenant: tenant1, ownerEmail: 'owner1@royalspice.com', outlets: ['Connaught Place', 'Gurgaon CyberHub', 'Noida Sector 18'] },
      { name: 'The Urban Bistro', tenant: tenant1, ownerEmail: 'owner2@urbanbistro.com', outlets: ['Indiranagar', 'Koramangala'] },
      { name: 'Sizzling Wok Asian', tenant: tenant2, ownerEmail: 'owner3@sizzlingwok.com', outlets: ['Bandra West', 'Juhu Beach', 'Powai Central'] },
      { name: 'Pizza & Pasta Craft', tenant: tenant2, ownerEmail: 'owner4@pizzacraft.com', outlets: ['Park Street', 'Salt Lake Sector 5'] },
    ];

    const mockCategories = ['Starters', 'Mains', 'Desserts', 'Beverages'];
    const mockItemsByCategory: Record<string, Array<{ name: string; price: number; isVeg: boolean; variants?: Array<{ name: string; price: number }>; addons?: Array<{ name: string; price: number }> }>> = {
      'Starters': [
        {
          name: 'Paneer Tikka Delight',
          price: 260,
          isVeg: true,
          variants: [{ name: 'Half Plate', price: 160 }, { name: 'Full Plate', price: 260 }],
          addons: [{ name: 'Extra Mint Chutney', price: 30 }, { name: 'Extra Cheese Dip', price: 45 }]
        },
        {
          name: 'Crispy Peri Peri Fries',
          price: 140,
          isVeg: true,
          variants: [{ name: 'Regular', price: 140 }, { name: 'Large Bucket', price: 210 }],
          addons: [{ name: 'Melted Cheese Sauce', price: 50 }]
        },
        { name: 'Chicken Seekh Kebab', price: 340, isVeg: false },
        { name: 'Veg Spring Rolls', price: 190, isVeg: true },
      ],
      'Mains': [
        {
          name: 'Dal Makhani Special',
          price: 290,
          isVeg: true,
          variants: [{ name: 'Medium Portion', price: 290 }, { name: 'Family Handi', price: 490 }],
          addons: [{ name: 'Extra Butter Top', price: 35 }]
        },
        { name: 'Butter Chicken Masala', price: 390, isVeg: false },
        { name: 'Kadahi Paneer Feast', price: 310, isVeg: true },
        { name: 'Hyderabadi Chicken Biryani', price: 360, isVeg: false },
      ],
      'Desserts': [
        { name: 'Gulab Jamun (2 pcs)', price: 90, isVeg: true },
        { name: 'Choco Lava Cake', price: 150, isVeg: true },
        { name: 'Saffron Matka Kulfi', price: 110, isVeg: true },
      ],
      'Beverages': [
        { name: 'Fresh Masala Lemonade', price: 80, isVeg: true },
        { name: 'Cold Coffee Shake', price: 130, isVeg: true },
        { name: 'Peach Iced Tea', price: 120, isVeg: true },
      ]
    };

    const mockIngredients = [
      { name: 'Basmati Rice', unit: 'kg', minStock: 20, currentStock: 150, cost: 80 },
      { name: 'Paneer Block', unit: 'kg', minStock: 10, currentStock: 45, cost: 320 },
      { name: 'Fresh Whole Chicken', unit: 'kg', minStock: 15, currentStock: 60, cost: 220 },
      { name: 'Amul Butter', unit: 'kg', minStock: 5, currentStock: 25, cost: 480 },
      { name: 'Mozzarella Cheese', unit: 'kg', minStock: 8, currentStock: 30, cost: 450 },
      { name: 'Cooking Oil', unit: 'L', minStock: 30, currentStock: 200, cost: 130 },
    ];

    let totalRestaurants = 0;
    let totalOutlets = 0;
    let totalManagers = 0;
    let totalStaff = 0;
    let totalMenuItems = 0;
    let totalVariants = 0;
    let totalAddons = 0;
    let totalInventoryItems = 0;
    let totalDiningAreas = 0;
    let totalTables = 0;
    let totalCoupons = 0;
    let totalOfflineOrders = 0;
    let totalPayments = 0;

    console.log('Seeding Restaurants, Outlets, Staff, Menu, Inventory, Tables & Orders...');

    for (let rIdx = 0; rIdx < restaurantConfigs.length; rIdx++) {
      const config = restaurantConfigs[rIdx]!;
      const tenant = config.tenant;

      // Restaurant
      const restaurant = await Restaurant.create({
        tenantId: tenant._id,
        name: config.name,
        brandName: `${config.name} Brand`,
        status: UserStatus.ACTIVE,
        createdBy: tenant._id.equals(tenant1._id) ? tenantAdmin1._id : tenantAdmin2._id,
      });
      totalRestaurants++;

      // Restaurant Owner
      const restroOwner = await User.create({
        tenantId: tenant._id,
        restaurantId: restaurant._id,
        firstName: 'Restro',
        lastName: `Owner ${rIdx + 1}`,
        email: config.ownerEmail,
        passwordHash,
        role: UserRole.RESTAURANT_OWNER,
        status: UserStatus.ACTIVE,
        invitationAccepted: true,
        createdBy: tenant._id.equals(tenant1._id) ? tenantAdmin1._id : tenantAdmin2._id,
      });

      // Subscription
      await RestaurantSubscriptionModel.create({
        tenantId: tenant._id,
        restaurantId: restaurant._id,
        planId: superPlan._id,
        plan: SubscriptionPlan.SUPER,
        amount: 9999,
        status: SaaSStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        renewalEnabled: true,
        paymentProvider: PaymentProvider.MANUAL,
        createdBy: restroOwner._id,
      });

      // Coupons for Restaurant
      const coupon1 = await Coupon.create({
        tenantId: tenant._id,
        restaurantId: restaurant._id,
        code: `WELCOME${rIdx + 1}0`,
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minOrderAmount: 300,
        maxDiscountAmount: 150,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      });
      totalCoupons++;

      // Outlets
      for (let oIdx = 0; oIdx < config.outlets.length; oIdx++) {
        const outletLocationName = config.outlets[oIdx]!;
        const outlet = await Outlet.create({
          tenantId: tenant._id,
          restaurantId: restaurant._id,
          name: `${config.name} - ${outletLocationName}`,
          address: `Plot ${oIdx + 1}, ${outletLocationName}`,
          city: 'Metropolis',
          state: 'State',
          pincode: '400001',
          location: { type: 'Point', coordinates: [77.2190 + (rIdx * 0.005) + (oIdx * 0.002), 28.6239 + (rIdx * 0.005) + (oIdx * 0.002)] },
          operatingHours: Object.values(WeekDay).map((day) => ({ day, openTime: '09:00', closeTime: '23:00', isClosed: false })),
          status: UserStatus.ACTIVE,
          createdBy: restroOwner._id,
        });
        totalOutlets++;

        // Manager
        const managerEmail = `manager_r${rIdx + 1}_o${oIdx + 1}@test.com`;
        const outletManager = await User.create({
          tenantId: tenant._id,
          restaurantId: restaurant._id,
          outletId: outlet._id,
          outletIds: [outlet._id],
          firstName: 'Outlet',
          lastName: `Manager R${rIdx + 1} O${oIdx + 1}`,
          email: managerEmail,
          passwordHash,
          role: UserRole.OUTLET_MANAGER,
          status: UserStatus.ACTIVE,
          invitationAccepted: true,
          createdBy: restroOwner._id,
        });
        totalManagers++;

        // Staff
        const staffIds: Types.ObjectId[] = [];
        for (let s = 1; s <= 3; s++) {
          const staffUser = await User.create({
            tenantId: tenant._id,
            restaurantId: restaurant._id,
            outletId: outlet._id,
            outletIds: [outlet._id],
            firstName: 'Staff',
            lastName: `R${rIdx + 1} O${oIdx + 1} S${s}`,
            email: `staff_r${rIdx + 1}_o${oIdx + 1}_s${s}@test.com`,
            passwordHash,
            role: UserRole.STAFF,
            status: UserStatus.ACTIVE,
            invitationAccepted: true,
            createdBy: outletManager._id,
          });
          staffIds.push(staffUser._id);
          totalStaff++;
        }

        // Dining Areas & Tables
        const mainHall = await DiningArea.create({
          tenantId: tenant._id,
          outletId: outlet._id,
          name: 'Main Dining Hall',
          description: 'Spacious ground floor seating area',
          isActive: true,
        });
        totalDiningAreas++;

        for (let t = 1; t <= 5; t++) {
          await Table.create({
            tenantId: tenant._id,
            outletId: outlet._id,
            diningAreaId: mainHall._id,
            tableNumber: `T-${t}`,
            seatCount: 4,
            status: 'ACTIVE',
            operationalStatus: t % 2 === 0 ? 'OCCUPIED' : 'AVAILABLE',
          });
          totalTables++;
        }

        // Menu, Categories, Variants, Addons, & Inventory
        const menuItemsCreated: Array<{ id: Types.ObjectId; name: string; price: number; variantId?: Types.ObjectId | undefined; addonId?: Types.ObjectId | undefined }> = [];

        for (const catName of mockCategories) {
          const category = await Category.create({
            tenantId: tenant._id,
            outletId: outlet._id,
            name: catName,
            displayOrder: mockCategories.indexOf(catName),
            isActive: true,
            createdBy: outletManager._id,
          });

          const itemTemplates = mockItemsByCategory[catName] || [];
          for (const itemTpl of itemTemplates) {
            const menuItem = await MenuItem.create({
              tenantId: tenant._id,
              outletId: outlet._id,
              categoryId: category._id,
              name: itemTpl.name,
              description: `Delicious ${itemTpl.name} freshly prepared.`,
              price: itemTpl.price,
              isVeg: itemTpl.isVeg,
              isAvailable: true,
              displayOrder: itemTemplates.indexOf(itemTpl),
              createdBy: outletManager._id,
            });
            totalMenuItems++;

            // Create Inventory record for MenuItem
            await Inventory.create({
              tenantId: tenant._id,
              outletId: outlet._id,
              menuItemId: menuItem._id,
              quantity: Math.floor(Math.random() * 80) + 20,
              threshold: 10,
              isLowStock: false,
              createdBy: outletManager._id,
            });
            totalInventoryItems++;

            let createdVariantId: Types.ObjectId | undefined;
            if (itemTpl.variants && itemTpl.variants.length > 0) {
              for (const v of itemTpl.variants) {
                const varDoc = await Variant.create({
                  tenantId: tenant._id,
                  outletId: outlet._id,
                  menuItemId: menuItem._id,
                  name: v.name,
                  price: v.price,
                  isAvailable: true,
                });
                createdVariantId = varDoc._id as Types.ObjectId;
                totalVariants++;
              }
            }

            let createdAddonId: Types.ObjectId | undefined;
            if (itemTpl.addons && itemTpl.addons.length > 0) {
              for (const a of itemTpl.addons) {
                const addDoc = await Addon.create({
                  tenantId: tenant._id,
                  outletId: outlet._id,
                  menuItemId: menuItem._id,
                  name: a.name,
                  price: a.price,
                  isAvailable: true,
                });
                createdAddonId = addDoc._id as Types.ObjectId;
                totalAddons++;
              }
            }

            menuItemsCreated.push({
              id: menuItem._id as Types.ObjectId,
              name: menuItem.name,
              price: menuItem.price,
              variantId: createdVariantId,
              addonId: createdAddonId,
            });
          }
        }

        // Seed 25 OFFLINE Orders per Outlet with OrderTimeline & Payments
        for (let ord = 1; ord <= 25; ord++) {
          const randomCustomer = customers[Math.floor(Math.random() * customers.length)]!;
          const randomOfflineSource = OFFLINE_SEED_SOURCES[Math.floor(Math.random() * OFFLINE_SEED_SOURCES.length)]!;

          let randomStatus: OrderStatus = OrderStatus.COMPLETED;
          const statusRand = Math.random();
          if (statusRand < 0.15) randomStatus = OrderStatus.PENDING;
          else if (statusRand < 0.35) randomStatus = OrderStatus.PREPARING;
          else if (statusRand < 0.50) randomStatus = OrderStatus.READY;
          else if (statusRand < 0.65) randomStatus = OrderStatus.SERVED;
          else if (statusRand < 0.75) randomStatus = OrderStatus.CANCELLED;

          let randomPaymentStatus = PaymentStatus.SUCCESS;
          if (randomStatus === OrderStatus.PENDING) randomPaymentStatus = PaymentStatus.PENDING;
          else if (randomStatus === OrderStatus.CANCELLED && Math.random() < 0.5) randomPaymentStatus = PaymentStatus.FAILED;

          const itemsCount = Math.floor(Math.random() * 3) + 1;
          const selectedItems: typeof menuItemsCreated = [];
          for (let i = 0; i < itemsCount; i++) {
            const randItem = menuItemsCreated[Math.floor(Math.random() * menuItemsCreated.length)];
            if (randItem && !selectedItems.some(item => item.id.equals(randItem.id))) {
              selectedItems.push(randItem);
            }
          }
          if (selectedItems.length === 0 && menuItemsCreated.length > 0) {
            selectedItems.push(menuItemsCreated[0]!);
          }

          let subtotal = 0;
          const orderItemsData: any[] = [];
          const orderId = new Types.ObjectId();

          for (const item of selectedItems) {
            const qty = Math.floor(Math.random() * 2) + 1;
            const totalPrice = qty * item.price;
            subtotal += totalPrice;

            const addonsList = item.addonId ? [{ addonId: item.addonId, name: 'Extra Sauce/Dip', price: 30 }] : [];

            orderItemsData.push({
              orderId,
              tenantId: tenant._id,
              menuItemId: item.id,
              variantId: item.variantId || null,
              addons: addonsList,
              name: item.name,
              quantity: qty,
              unitPrice: item.price,
              totalPrice,
              course: 'IMMEDIATE',
              holdStatus: 'FIRED',
              createdBy: randomCustomer._id,
            });
          }

          const tax = Math.round(subtotal * 0.05 * 100) / 100;
          const deliveryFee = 0;
          const discount = Math.random() < 0.3 ? 40 : 0;
          const totalAmount = Math.max(0, subtotal + tax + deliveryFee - discount);

          const daysAgo = Math.floor(Math.random() * 20);
          const orderDate = new Date();
          orderDate.setDate(orderDate.getDate() - daysAgo);
          orderDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

          await OrderItem.insertMany(orderItemsData);

          const createdOrder = await Order.create({
            _id: orderId,
            tenantId: tenant._id,
            outletId: outlet._id,
            customerId: randomCustomer._id,
            source: randomOfflineSource,
            subtotal,
            tax,
            deliveryFee,
            discount,
            totalAmount,
            orderStatus: randomStatus,
            paymentStatus: randomPaymentStatus,
            createdAt: orderDate,
            updatedAt: orderDate,
            createdBy: randomCustomer._id,
            waiterId: (randomStatus as string) === OrderStatus.SERVED || (randomStatus as string) === OrderStatus.COMPLETED ? staffIds[Math.floor(Math.random() * staffIds.length)] : null,
          });
          totalOfflineOrders++;

          // Order Timeline
          await OrderTimeline.create({
            tenantId: tenant._id,
            orderId: createdOrder._id,
            status: randomStatus,
            sourceSystem: 'POS_SYSTEM',
            timestamp: orderDate,
          });

          // Payment Document
          if (randomPaymentStatus === PaymentStatus.SUCCESS) {
            await Payment.create({
              tenantId: tenant._id,
              outletId: outlet._id,
              orderId: createdOrder._id,
              customerId: randomCustomer._id,
              amount: totalAmount,
              paymentMethod: Math.random() > 0.5 ? PaymentMethod.UPI : PaymentMethod.CASH,
              paymentStatus: PaymentStatus.SUCCESS,
              transactionId: `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
              createdAt: orderDate,
            });
            totalPayments++;
          }

          await Customer.updateOne(
            { _id: randomCustomer._id },
            { $inc: { totalOrders: 1, totalSpent: totalAmount } }
          );
        }

        // Review Analytics & Notifications
        await ReviewAnalytics.create({
          tenantId: tenant._id,
          outletId: outlet._id,
          source: ReviewSource.GOOGLE,
          rating: 4.5,
          sentiment: SentimentLabel.POSITIVE,
          reviewText: 'Great food, friendly staff and fast service!',
          createdAt: new Date(),
        });

        await Notification.create({
          tenantId: tenant._id,
          userId: outletManager._id,
          type: NotificationType.ORDER_PLACED,
          title: 'Daily Operations Active',
          message: `${outlet.name} is fully initialized and operational.`,
          isRead: false,
        });

        await AuditLog.create({
          tenantId: tenant._id,
          userId: outletManager._id,
          action: AuditAction.CREATE,
          entityType: 'Outlet',
          entityId: outlet._id,
          newData: { message: 'Outlet initialized in seed script.' },
        });
      }
    }

    console.log('\n================ SEEDING COMPLETE SUMMARY ================');
    console.log(`System Admins (2):`);
    console.log(`  - systemadmin1@test.com / ${PASSWORD_PLAIN}`);
    console.log(`  - systemadmin2@test.com / ${PASSWORD_PLAIN}`);
    console.log(`Tenants (2):`);
    console.log(`  - tenantadmin1@test.com (OmniServe Prime) / ${PASSWORD_PLAIN}`);
    console.log(`  - tenantadmin2@test.com (OmniServe Express) / ${PASSWORD_PLAIN}`);
    console.log(`Restaurants Seeded: ${totalRestaurants}`);
    console.log(`Outlets Seeded: ${totalOutlets}`);
    console.log(`Outlet Managers Seeded: ${totalManagers}`);
    console.log(`Staff Members Seeded: ${totalStaff}`);
    console.log(`Customers Seeded: ${customers.length}`);
    console.log(`Categories & MenuItems Seeded: ${totalMenuItems}`);
    console.log(`Variants Seeded: ${totalVariants}`);
    console.log(`Addons Seeded: ${totalAddons}`);
    console.log(`Inventory Items Seeded: ${totalInventoryItems}`);
    console.log(`Dining Areas Seeded: ${totalDiningAreas}`);
    console.log(`Tables Seeded: ${totalTables}`);
    console.log(`Coupons Seeded: ${totalCoupons}`);
    console.log(`Offline Orders & Items Seeded: ${totalOfflineOrders}`);
    console.log(`Payments Recorded: ${totalPayments}`);
    console.log(`Online Orders Seeded: 0 (Pure environment for Order Simulator!)`);
    console.log('===========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

runSeed();
