const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create password hash
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Create SUPERADMIN user
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@domum.com.ar' },
    update: {},
    create: {
      email: 'superadmin@domum.com.ar',
      passwordHash,
      name: 'Super Administrador',
      phone: '+54 9 11 1234-5678',
      role: 'SUPERADMIN',
      avatar: 'SA'
    }
  });
  console.log('Created SUPERADMIN:', superadmin.email);

  // Create ADMIN user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@domum.com.ar' },
    update: {},
    create: {
      email: 'admin@domum.com.ar',
      passwordHash,
      name: 'Martín Domum',
      phone: '+54 9 11 2345-6789',
      role: 'ADMIN',
      avatar: 'MD',
      createdById: superadmin.id
    }
  });
  console.log('Created ADMIN:', admin.email);

  // Create VENDEDOR users
  const vendedor1 = await prisma.user.upsert({
    where: { email: 'carlos.rodriguez@domum.com.ar' },
    update: {},
    create: {
      email: 'carlos.rodriguez@domum.com.ar',
      passwordHash,
      name: 'Carlos Rodríguez',
      phone: '+54 9 11 4567-1234',
      role: 'VENDEDOR',
      avatar: 'CR',
      createdById: admin.id
    }
  });
  console.log('Created VENDEDOR:', vendedor1.email);

  const vendedor2 = await prisma.user.upsert({
    where: { email: 'ana.martinez@domum.com.ar' },
    update: {},
    create: {
      email: 'ana.martinez@domum.com.ar',
      passwordHash,
      name: 'Ana Martínez',
      phone: '+54 9 11 5678-2345',
      role: 'VENDEDOR',
      avatar: 'AM',
      createdById: admin.id
    }
  });
  console.log('Created VENDEDOR:', vendedor2.email);

  const vendedor3 = await prisma.user.upsert({
    where: { email: 'diego.lopez@domum.com.ar' },
    update: {},
    create: {
      email: 'diego.lopez@domum.com.ar',
      passwordHash,
      name: 'Diego López',
      phone: '+54 9 11 6789-3456',
      role: 'VENDEDOR',
      avatar: 'DL',
      createdById: admin.id
    }
  });
  console.log('Created VENDEDOR:', vendedor3.email);

  // Create sample properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        title: 'Departamento 3 amb. con balcón',
        description: 'Hermoso departamento en Palermo con vista al parque',
        type: 'DEPARTAMENTO',
        operation: 'VENTA',
        status: 'DISPONIBLE',
        price: 185000,
        currency: 'USD',
        address: 'Av. Santa Fe 3200',
        city: 'CABA',
        neighborhood: 'Palermo',
        totalArea: 85,
        coveredArea: 75,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        parkingSpaces: 1,
        amenities: ['balcon', 'cocina_equipada', 'aire_acondicionado'],
        featured: true,
        assignedToId: vendedor1.id
      }
    }),
    prisma.property.create({
      data: {
        title: 'Casa 4 amb. con jardín y pileta',
        description: 'Espectacular casa en barrio cerrado',
        type: 'CASA',
        operation: 'VENTA',
        status: 'DISPONIBLE',
        price: 320000,
        currency: 'USD',
        address: 'Los Robles 450',
        city: 'Pilar',
        neighborhood: 'Los Robles',
        totalArea: 400,
        coveredArea: 220,
        rooms: 4,
        bedrooms: 3,
        bathrooms: 3,
        parkingSpaces: 2,
        amenities: ['pileta', 'jardin', 'parrilla', 'seguridad_24hs'],
        featured: true,
        assignedToId: vendedor2.id
      }
    }),
    prisma.property.create({
      data: {
        title: 'Monoambiente luminoso',
        description: 'Ideal para inversión, excelente ubicación',
        type: 'DEPARTAMENTO',
        operation: 'ALQUILER',
        status: 'DISPONIBLE',
        price: 250000,
        currency: 'ARS',
        address: 'Medrano 500',
        city: 'CABA',
        neighborhood: 'Almagro',
        totalArea: 35,
        coveredArea: 35,
        rooms: 1,
        bedrooms: 0,
        bathrooms: 1,
        amenities: ['luminoso', 'cocina_equipada'],
        assignedToId: vendedor2.id
      }
    })
  ]);
  console.log('Created', properties.length, 'properties');

  // Create sample leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        name: 'Andrés Morales',
        email: 'andres.morales@gmail.com',
        phone: '+54 9 11 5678-9013',
        source: 'REFERIDO',
        stage: 'EN_PROCESO',
        score: 85,
        budgetMin: 100000,
        budgetMax: 150000,
        budgetCurrency: 'USD',
        interests: ['departamento', 'ph'],
        preferredZones: ['Palermo', 'Almagro'],
        notes: 'Tiene crédito pre-aprobado. Muy interesado.',
        assignedToId: vendedor1.id,
        createdById: vendedor1.id,
        propertyId: properties[0].id
      }
    }),
    prisma.lead.create({
      data: {
        name: 'Sofía Ruiz',
        email: 'sofia.ruiz@outlook.com',
        phone: '+54 9 11 6789-0124',
        source: 'REFERIDO',
        stage: 'NEGOCIACION',
        score: 92,
        budgetMin: 250000,
        budgetMax: 350000,
        budgetCurrency: 'USD',
        interests: ['casa', 'duplex'],
        preferredZones: ['Pilar', 'San Isidro'],
        notes: 'En negociación, ofreció USD 260.000',
        assignedToId: vendedor3.id,
        createdById: admin.id,
        propertyId: properties[1].id
      }
    }),
    prisma.lead.create({
      data: {
        name: 'Pablo González',
        email: 'pablo.gonzalez@empresa.com',
        phone: '+54 9 11 1098-7654',
        source: 'REFERIDO',
        stage: 'CERRADO',
        score: 100,
        budgetMin: 300000,
        budgetMax: 350000,
        budgetCurrency: 'USD',
        interests: ['casa'],
        preferredZones: ['Pilar'],
        closedDate: new Date('2026-03-08'),
        closedAmount: 315000,
        assignedToId: vendedor2.id,
        createdById: admin.id,
        propertyId: properties[1].id
      }
    }),
    prisma.lead.create({
      data: {
        name: 'Camila Ibáñez',
        email: 'cami.ibanez@outlook.com',
        phone: '+54 9 11 7654-3210',
        source: 'REFERIDO',
        stage: 'EN_PROCESO',
        score: 80,
        budgetMin: 200000,
        budgetMax: 350000,
        budgetCurrency: 'ARS',
        interests: ['departamento'],
        preferredZones: ['Almagro', 'Caballito'],
        notes: 'Busca alquilar monoambiente',
        assignedToId: vendedor2.id,
        createdById: vendedor2.id,
        propertyId: properties[2].id
      }
    })
  ]);
  console.log('Created', leads.length, 'leads');

  // Create sample activities for leads
  await prisma.leadActivity.createMany({
    data: [
      { type: 'visita', date: new Date('2026-03-08'), notes: 'Primera visita al PH', leadId: leads[0].id },
      { type: 'llamada', date: new Date('2026-03-05'), notes: 'Llamada para coordinar', leadId: leads[0].id },
      { type: 'oferta', date: new Date('2026-03-09'), notes: 'Presentó oferta de USD 260.000', leadId: leads[1].id },
      { type: 'visita', date: new Date('2026-03-06'), notes: 'Segunda visita con esposo', leadId: leads[1].id },
      { type: 'seña', date: new Date('2026-03-08'), notes: 'Firmó boleto de seña', leadId: leads[2].id }
    ]
  });
  console.log('Created lead activities');

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        type: 'INGRESO',
        category: 'COMISION_VENTA',
        amount: 9450,
        currency: 'USD',
        description: 'Comisión venta Casa Los Robles',
        date: new Date('2026-03-08'),
        reference: 'Casa 4 amb - Pilar'
      },
      {
        type: 'EGRESO',
        category: 'PUBLICIDAD',
        amount: 150000,
        currency: 'ARS',
        description: 'Publicidad Zonaprop - Marzo',
        date: new Date('2026-03-01')
      },
      {
        type: 'EGRESO',
        category: 'SERVICIOS',
        amount: 45000,
        currency: 'ARS',
        description: 'Internet y teléfono oficina',
        date: new Date('2026-03-05')
      }
    ]
  });
  console.log('Created sample transactions');

  console.log('Seeding completed!');
  console.log('');
  console.log('Default credentials:');
  console.log('  SUPERADMIN: superadmin@domum.com.ar / Admin123!');
  console.log('  ADMIN: admin@domum.com.ar / Admin123!');
  console.log('  VENDEDOR: carlos.rodriguez@domum.com.ar / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
