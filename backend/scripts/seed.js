const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Service, Order, Review, Conversation, Message } = require('../models');
require('dotenv').config();

// Sample data
const categories = [
  { id: 'graphics-design', name: 'Graphics & Design', subcategories: ['Logo Design', 'Brand Identity', 'Web Design'] },
  { id: 'digital-marketing', name: 'Digital Marketing', subcategories: ['Social Media', 'SEO', 'Content Marketing'] },
  { id: 'writing-translation', name: 'Writing & Translation', subcategories: ['Article Writing', 'Copywriting', 'Translation'] },
  { id: 'video-animation', name: 'Video & Animation', subcategories: ['Video Editing', 'Animation', 'Motion Graphics'] },
  { id: 'programming-tech', name: 'Programming & Tech', subcategories: ['Web Development', 'Mobile Apps', 'WordPress'] }
];

const skillsPool = [
  'JavaScript', 'React', 'Node.js', 'Python', 'PHP', 'WordPress', 'SEO', 'Content Writing',
  'Graphic Design', 'UI/UX Design', 'Video Editing', 'Social Media Marketing', 'Photoshop',
  'Illustrator', 'Figma', 'HTML/CSS', 'MongoDB', 'SQL', 'AWS', 'Docker'
];

const sampleUsers = [
  {
    email: 'admin@freelance.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    role: 'admin',
    bio: 'Platform administrator'
  },
  {
    email: 'client@example.com',
    password: 'Client123!',
    firstName: 'John',
    lastName: 'Client',
    username: 'johnclient',
    role: 'client',
    bio: 'Looking for talented freelancers to help with my projects'
  },
  {
    email: 'freelancer@example.com',
    password: 'Freelancer123!',
    firstName: 'Sarah',
    lastName: 'Designer',
    username: 'sarahdesigner',
    role: 'freelancer',
    bio: 'Professional graphic designer with 5+ years of experience',
    skills: ['Graphic Design', 'Logo Design', 'Brand Identity', 'Photoshop', 'Illustrator']
  },
  {
    email: 'developer@example.com',
    password: 'Dev123!',
    firstName: 'Mike',
    lastName: 'Developer',
    username: 'mikedev',
    role: 'freelancer',
    bio: 'Full-stack developer specializing in React and Node.js',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express']
  },
  {
    email: 'writer@example.com',
    password: 'Writer123!',
    firstName: 'Emily',
    lastName: 'Writer',
    username: 'emilywrites',
    role: 'freelancer',
    bio: 'Professional content writer and copywriter',
    skills: ['Content Writing', 'Copywriting', 'SEO', 'Blog Writing', 'Editing']
  }
];

const sampleServices = [
  {
    title: 'I will design a professional logo for your business',
    description: 'Get a stunning, professional logo design that represents your brand perfectly. I will create a unique and memorable logo that will help your business stand out from the competition.\n\nWhat you get:\n- 3 initial logo concepts\n- Unlimited revisions\n- High-resolution files (PNG, JPG, PDF)\n- Vector files (AI, EPS, SVG)\n- Full ownership rights\n\nMy process:\n1. Understanding your brand and requirements\n2. Research and concept development\n3. Design and refinement\n4. Final delivery\n\nI have designed logos for over 500+ businesses worldwide. Let me help you create a logo that makes a lasting impression!',
    category: 'graphics-design',
    subcategory: 'Logo Design',
    tags: ['logo design', 'branding', 'graphic design', 'business logo', 'professional logo'],
    packages: [
      {
        name: 'basic',
        title: 'Basic Logo Package',
        description: '1 logo concept with 2 revisions',
        price: 50,
        deliveryTime: 3,
        revisions: 2,
        features: ['1 logo concept', '2 revisions', 'PNG & JPG files', 'High resolution']
      },
      {
        name: 'standard',
        title: 'Standard Logo Package',
        description: '3 logo concepts with unlimited revisions',
        price: 100,
        deliveryTime: 5,
        revisions: 5,
        features: ['3 logo concepts', '5 revisions', 'All source files', 'Vector files', 'Social media kit']
      },
      {
        name: 'premium',
        title: 'Premium Logo Package',
        description: '5 logo concepts with unlimited revisions and brand guidelines',
        price: 200,
        deliveryTime: 7,
        revisions: 10,
        features: ['5 logo concepts', 'Unlimited revisions', 'Complete brand guidelines', 'Business card design', 'Letterhead design', 'Priority support']
      }
    ]
  },
  {
    title: 'I will build a modern responsive website for you',
    description: 'Need a professional website? I will create a stunning, fully responsive website using the latest technologies. Whether you need a portfolio, business website, or landing page, I have got you covered.\n\nWhat I offer:\n- Custom design tailored to your brand\n- Fully responsive (mobile, tablet, desktop)\n- SEO optimized\n- Fast loading speed\n- Easy to manage\n\nTechnologies I use:\n- React / Next.js\n- Node.js / Express\n- MongoDB\n- Tailwind CSS\n\nLet us build something amazing together!',
    category: 'programming-tech',
    subcategory: 'Web Development',
    tags: ['web development', 'react', 'nodejs', 'responsive', 'website'],
    packages: [
      {
        name: 'basic',
        title: 'Basic Website',
        description: 'Single page website',
        price: 150,
        deliveryTime: 5,
        revisions: 2,
        features: ['1 page', 'Responsive design', 'Contact form', '2 revisions']
      },
      {
        name: 'standard',
        title: 'Standard Website',
        description: 'Multi-page website up to 5 pages',
        price: 400,
        deliveryTime: 10,
        revisions: 5,
        features: ['Up to 5 pages', 'Responsive design', 'Contact form', 'Blog setup', '5 revisions']
      },
      {
        name: 'premium',
        title: 'Premium Website',
        description: 'Full-featured website with advanced functionality',
        price: 800,
        deliveryTime: 20,
        revisions: 10,
        features: ['Unlimited pages', 'Custom functionality', 'E-commerce ready', 'Admin panel', 'SEO optimization', '10 revisions']
      }
    ]
  },
  {
    title: 'I will write SEO-optimized blog articles for your website',
    description: 'High-quality, SEO-optimized content that drives traffic and engages your audience. I specialize in creating compelling blog posts that rank well in search engines and keep readers coming back for more.\n\nWhat you get:\n- Well-researched, original content\n- SEO optimized with proper keywords\n- Engaging and readable writing style\n- Proper formatting with headings and subheadings\n- Proofread and error-free\n\nTopics I cover:\n- Technology\n- Business\n- Health & Wellness\n- Lifestyle\n- Finance\n\nLet me help you build your content library!',
    category: 'writing-translation',
    subcategory: 'Article Writing',
    tags: ['content writing', 'blog writing', 'seo', 'articles', 'copywriting'],
    packages: [
      {
        name: 'basic',
        title: 'Basic Article',
        description: '500-word article',
        price: 25,
        deliveryTime: 2,
        revisions: 1,
        features: ['500 words', 'SEO optimized', '1 revision', 'Royalty-free images']
      },
      {
        name: 'standard',
        title: 'Standard Article',
        description: '1000-word article with research',
        price: 50,
        deliveryTime: 3,
        revisions: 2,
        features: ['1000 words', 'In-depth research', 'SEO optimized', '2 revisions', 'Meta description']
      },
      {
        name: 'premium',
        title: 'Premium Article',
        description: '2000-word comprehensive article',
        price: 100,
        deliveryTime: 5,
        revisions: 3,
        features: ['2000 words', 'Comprehensive research', 'SEO optimized', '3 revisions', 'Social media snippets', 'Content upgrade suggestions']
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_marketplace', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Service.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    
    console.log('Creating users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.username} (${user.role})`);
    }
    
    // Get freelancer users
    const freelancers = createdUsers.filter(u => u.role === 'freelancer');
    const clients = createdUsers.filter(u => u.role === 'client');
    
    console.log('Creating services...');
    const createdServices = [];
    
    for (let i = 0; i < sampleServices.length; i++) {
      const serviceData = sampleServices[i];
      const freelancer = freelancers[i % freelancers.length];
      
      const service = new Service({
        ...serviceData,
        freelancer: freelancer._id,
        status: 'active',
        images: [`/uploads/services/sample-${i + 1}.jpg`]
      });
      
      await service.save();
      createdServices.push(service);
      console.log(`Created service: ${service.title}`);
    }
    
    console.log('Creating sample orders...');
    
    // Create a completed order with review
    const completedOrder = new Order({
      service: createdServices[0]._id,
      package: createdServices[0].packages[1],
      client: clients[0]._id,
      freelancer: freelancers[0]._id,
      requirements: 'I need a modern, professional logo for my tech startup called "TechFlow". We specialize in AI solutions. Please use blue and green colors.',
      status: 'completed',
      price: createdServices[0].packages[1].price,
      deliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      revisionsLeft: 3,
      paymentStatus: 'released',
      platformFee: createdServices[0].packages[1].price * 0.2,
      freelancerEarnings: createdServices[0].packages[1].price * 0.8
    });
    
    await completedOrder.save();
    console.log('Created completed order');
    
    // Create a review for the completed order
    const review = new Review({
      order: completedOrder._id,
      service: createdServices[0]._id,
      reviewer: clients[0]._id,
      freelancer: freelancers[0]._id,
      rating: 5,
      review: 'Absolutely amazing work! Sarah understood exactly what I wanted and delivered a logo that perfectly represents my brand. The communication was excellent throughout the process. Highly recommended!',
      communication: 5,
      serviceQuality: 5,
      recommend: true
    });
    
    await review.save();
    
    // Update order with review
    completedOrder.review = review._id;
    await completedOrder.save();
    
    // Update service and freelancer ratings
    await createdServices[0].updateRating();
    
    console.log('Created review');
    
    // Create an active order
    const activeOrder = new Order({
      service: createdServices[1]._id,
      package: createdServices[1].packages[1],
      client: clients[0]._id,
      freelancer: freelancers[1]._id,
      requirements: 'I need a professional website for my consulting business. It should have a home page, about page, services page, and contact page.',
      status: 'active',
      price: createdServices[1].packages[1].price,
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      revisionsLeft: 5,
      paymentStatus: 'held'
    });
    
    await activeOrder.save();
    console.log('Created active order');
    
    // Create a pending order
    const pendingOrder = new Order({
      service: createdServices[2]._id,
      package: createdServices[2].packages[0],
      client: clients[0]._id,
      freelancer: freelancers[2]._id,
      requirements: 'I need a blog article about the benefits of meditation for busy professionals.',
      status: 'pending',
      price: createdServices[2].packages[0].price,
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      revisionsLeft: 1,
      paymentStatus: 'pending'
    });
    
    await pendingOrder.save();
    console.log('Created pending order');
    
    // Create sample conversations
    console.log('Creating conversations...');
    
    const conversation1 = new Conversation({
      participants: [clients[0]._id, freelancers[0]._id],
      type: 'direct',
      lastMessage: null
    });
    
    await conversation1.save();
    
    // Create sample messages
    const message1 = new Message({
      conversation: conversation1._id,
      sender: clients[0]._id,
      recipient: freelancers[0]._id,
      content: 'Hi! I just placed an order for a logo design. Looking forward to working with you!',
      isRead: true,
      readAt: new Date()
    });
    
    await message1.save();
    
    const message2 = new Message({
      conversation: conversation1._id,
      sender: freelancers[0]._id,
      recipient: clients[0]._id,
      content: 'Hello! Thank you for your order. I will start working on your logo right away. I will send you the initial concepts soon.',
      isRead: true,
      readAt: new Date()
    });
    
    await message2.save();
    
    // Update conversation
    conversation1.lastMessage = message2._id;
    await conversation1.save();
    
    console.log('Created conversation and messages');
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest accounts:');
    console.log('Admin: admin@freelance.com / Admin123!');
    console.log('Client: client@example.com / Client123!');
    console.log('Freelancer: freelancer@example.com / Freelancer123!');
    console.log('Developer: developer@example.com / Dev123!');
    console.log('Writer: writer@example.com / Writer123!');
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

seedDatabase();