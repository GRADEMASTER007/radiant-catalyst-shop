# Remix of Remix of GUT Health Website SA

The Zip file is a eccomerce app that i build on manus ai, i also included the filetree and the build that should already be done, but it will be best if you audit that form me please then i i will be pasting the new prompt , PLEASE COMPLETE THE ECCOMERCE APP FOR ME :  LOVABLE FULL-STACK E-COMMERCE PLATFORM MASTER PROMPT
Project: Base E-commerce Platform for 10 Business Websites
Delivery: Production-Ready Full-Stack Application
Target: Lovable AI Platform Deployment
Status: Ready for Immediate Development

📋 EXECUTIVE SUMMARY
You are receiving a complete specification to build a production-ready e-commerce platform that will serve as the base for 10 different business websites. The platform must include comprehensive AI integration with 20+ providers, Zoho CRM integration, PDF/image catalog generation, and modern UI/UX with glass effects and animations.

🎯 CRITICAL BUSINESS REQUIREMENTS
Multi-Tenant Architecture
Single codebase supporting 10 different business websites
All sales, WhatsApp, and chat conversations funnel to Zoho CRM
Shared admin panel with business-specific branding capabilities
Independent product catalogs per business
AI Integration Requirements
20+ AI Providers with automatic failover
Free-tier optimization with token limit management
Chat vs Feature routing intelligence
PDF/Image catalog generator in admin panel
Conversational AI with product recommendations
E-commerce Core Features
Modern, responsive design with glass effects
Animated text and scrolling animations
Product catalog with AI-generated descriptions
Multi-provider payment gateways (PayFast, Yoco)
South African shipping integration (Courier Guy, PUDO)
Zoho CRM integration for all customer interactions
🔧 TECHNICAL SPECIFICATIONS
Architecture Stack
Frontend: React with TypeScript
Backend: Node.js with Express/tRPC
Database: PostgreSQL with Drizzle ORM
AI Integration: 20+ providers with fallback
CRM: Zoho integration
Deployment: Lovable platform
AI Provider Configuration (20+ Providers)
Primary Providers with Free Tiers:

{
  "openrouter": {
    "baseUrl": "https://openrouter.ai/api/v1",
    "freeModels": ["meta-llama/llama-3.1-70b-instruct:free", "qwen/qwen3-coder:free"],
    "limits": "50 req/day free, 1000 req/day with credits"
  },
  "groq": {
    "baseUrl": "https://api.groq.com/openai/v1",
    "freeModels": ["mixtral-8x7b-32768", "llama-3.1-70b-versatile"],
    "limits": "14,400 req/day, 6,000 TPM"
  },
  "qwen": {
    "baseUrl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    "freeModels": ["qwen3-coder-plus", "qwen2.5-72b-instruct"],
    "limits": "2,000 free req/day"
  },
  "1min_ai": {
    "baseUrl": "https://api.1min.ai",
    "endpoints": {
      "feature": "/feature",
      "conversation": "/conversation"
    }
  },
  "api_free": {
    "baseUrl": "https://api.apifree.ai/v1"
  },
  "google_gemini": {
    "baseUrl": "https://generativelanguage.googleapis.com/v1beta"
  },
  "hugging_face": {
    "baseUrl": "https://api-inference.huggingface.co/models/"
  },
  "anthropic": {
    "baseUrl": "https://api.anthropic.com/v1"
  },
  "mistral": {
    "baseUrl": "https://api.mistral.ai/v1"
  },
  "together_ai": {
    "baseUrl": "https://api.together.xyz/v1"
  }
}
Additional Providers to Reach 20+:

xAI (Grok)
OpenAI
Freeplay.ai
Clarifai
Cerebras
AI.CC
Requesty.AI
Ollama Cloud
Straico
Perplexity Sonar
AI Feature Requirements
Chat Intelligence:

Must know all website pages and information
Conversational product recommendations
Popular products and combination suggestions
Knowledge base integration (URLs, PDFs, documents)
Context-aware responses
Catalog Generation:

AI-powered PDF catalog creator
Professional layouts and descriptions
Image optimization and processing
Brand-consistent styling
Multi-format export capabilities
Zoho CRM Integration
// Required Zoho Modules
const zohoModules = {
  leads: '/crm/v3/Leads',
  contacts: '/crm/v3/Contacts',
  deals: '/crm/v3/Deals',
  accounts: '/crm/v3/Accounts',
  tasks: '/crm/v3/Tasks'
};

// Integration Points
- Sales data synchronization
- WhatsApp conversation logging
- Chat transcript storage
- Customer interaction history
- Order status updates
🏗️ PHASED DEVELOPMENT PLAN
Phase 1: Foundation Audit (Current State)
✅ COMPLETED BY MANUS AI

Audit existing codebase from provided ZIP
Verify 20 AI provider integrations
Confirm admin panel functionality
Validate database schema readiness
Phase 2: Payment Gateway Integration
🔴 LOVABLE RESPONSIBILITY

PayFast Integration:

interface PayFastConfig {
  merchant_id: string;
  merchant_key: string;
  passphrase: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
}

// Required endpoints
- Payment initiation
- ITN (Instant Transaction Notification) handler
- Success/failure/cancel handling
- Refund processing
Yoco Integration:

interface YocoConfig {
  public_key: string;
  secret_key: string;
  api_url: string;
}

// Features needed
- Inline card processing
- 3D Secure support
- Tokenization
- Webhook handling
Phase 3: Shipping Integration
🔴 LOVABLE RESPONSIBILITY

Courier Guy API:

interface ShippingRequest {
  weight_kg: number;
  dimensions: { length: number; width: number; height: number };
  destination_postal_code: string;
  origin_postal_code: string;
}

// Services required
- Real-time rate calculation
- Tracking integration
- Label generation
- POD (Proof of Delivery)
PUDO Locker Integration:

interface PUDOConfig {
  api_key: string;
  base_url: string;
  locker_limit: { max_length: number; max_width: number; max_height: number };
}

// Features
- Locker location finder
- Size validation
- Reservation system
- Pickup notifications
Phase 4: Product Catalog & UI/UX
🔴 LOVABLE RESPONSIBILITY

Modern Design Requirements:

Glass morphism effects
Smooth scrolling animations
Animated text and hero sections
Colorful, vibrant palettes
Responsive mobile-first design
Admin Catalog Features:

interface ProductCatalog {
  ai_description_generator: boolean;
  bulk_import: boolean;
  image_optimization: boolean;
  seo_optimization: boolean;
  variant_management: boolean;
}

// AI Catalog Generator
- PDF layout templates
- Image processing pipeline
- Description generation
- SEO optimization
- Multi-language support
Phase 5: Multi-Tenant Deployment
🔴 LOVABLE RESPONSIBILITY

10-Website Architecture:

interface BusinessConfig {
  id: string;
  name: string;
  domain: string;
  branding: {
    colors: string[];
    logo: string;
    hero_video?: string;
    fonts: string[];
  };
  products: Product[];
  ai_config: AIProviderConfig;
}

// Deployment strategy
- Shared database with tenant isolation
- Custom domains per business
- Independent branding configurations
- Shared AI provider pool
🎨 BRANDING & UI/UX REQUIREMENTS
Design System
/* Glass Effect Styling */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

/* Animation System */
@keyframes scroll-text {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.animated-text {
  animation: scroll-text 15s linear infinite;
}

/* Color Palette Variants */
.primary-brand { /* Business-specific colors */ }
.secondary-brand { /* Dynamic based on business */ }
Hero Section Requirements
Video background support
Animated text overlays
Glass effect navigation
Mobile-responsive design
Call-to-action animations
🔄 ZOHO CRM INTEGRATION SPECIFICATION
Data Flow Architecture
Website Actions → CRM Integration
├─ Sales → Zoho Deals + Contacts
├─ WhatsApp → Zoho Tasks + Conversations
├─ Chats → Zoho Activities + Notes
└─ Catalog Requests → Zoho Leads
Required Endpoints
// Sales Data Sync
POST /api/zoho/sales → Creates Deal + Contact

// Conversation Logging
POST /api/zoho/conversations → Logs chat/WhatsApp

// Lead Generation
POST /api/zoho/leads → Catalog requests, sign-ups

// Task Creation
POST /api/zoho/tasks → Follow-up activities
🧪 TESTING & QUALITY ASSURANCE
Comprehensive Test Suite
// AI Provider Testing
describe('AI Provider Fallback', () => {
  test('should fallback when primary provider fails');
  test('should respect token limits');
  test('should maintain conversation context');
});

// Payment Gateway Testing
describe('Payment Processing', () => {
  test('PayFast successful payment');
  test('Yoco card processing');
  test('Multi-currency handling');
});

// Multi-tenant Testing
describe('Business Isolation', () => {
  test('data separation between businesses');
  test('branding customization per business');
  test('independent product catalogs');
});
Performance Requirements
Page load < 3 seconds
AI response time < 5 seconds
Mobile optimization score > 90
SEO optimization ready
🚀 DEPLOYMENT ON LOVABLE
Lovable-Specific Configuration
# lovable.yaml
build:
  type: nodejs
  output: dist
  
deploy:
  instances: 10
  domains:
    - business1.com
    - business2.com
    # ... up to 10 businesses
  
ai_integration:
  providers: 20+
  fallback: enabled
  monitoring: enabled
Environment Variables Template
# AI Providers
OPENROUTER_API_KEY=your_key
GROQ_API_KEY=your_key
QWEN_API_KEY=your_key
# ... 20+ providers

# Payment Gateways
PAYFAST_MERCHANT_ID=your_id
PAYFAST_MERCHANT_KEY=your_key
YOCO_SECRET_KEY=your_key

# Shipping Providers
COURIER_GUY_API_KEY=your_key
PUDO_API_KEY=your_key

# Zoho CRM
ZOHO_CLIENT_ID=your_id
ZOHO_CLIENT_SECRET=your_secret
ZOHO_REFRESH_TOKEN=your_token

# Multi-tenant Configuration
BUSINESS_COUNT=10
DEFAULT_BRANDING=default
📊 SUCCESS METRICS
Technical Metrics
✅ 20+ AI providers integrated and functional
✅ Zoho CRM integration working for all 10 businesses
✅ Payment gateways processing transactions
✅ Shipping calculators providing real-time rates
✅ PDF catalog generation with AI descriptions
✅ Mobile-responsive glass effect UI
Business Metrics
✅ 10 independent business websites deployed
✅ All sales data flowing to Zoho CRM
✅ WhatsApp and chat conversations logged in CRM
✅ AI-powered product recommendations live
✅ Professional catalog generation operational
🎯 DELIVERABLES
Phase 1: Foundation Audit Report
 Codebase analysis report
 Gap analysis document
 Technical debt assessment
Phase 2-5: Implementation
 Complete source code repository
 Database schema and migrations
 API documentation
 Deployment scripts
 Testing suite
Final Delivery
 10 deployed business websites
 Admin panel with AI catalog generator
 Zoho CRM integration verified
 Performance optimization report
 Security audit completion
💡 ADDITIONAL REQUIREMENTS
AI Model Specifics for Catalog Generation
// Preferred models for different tasks
const catalogModels = {
  description: 'mixtral-8x7b-32768', // Long context, creative
  seo: 'qwen3-coder-plus', // SEO optimization
  image_processing: 'clip-vit-large-patch14', // Image analysis
  layout: 'gpt-4', // PDF structure
};

// Token limits per business type
const tokenLimits = {
  fashion: { max_tokens: 2000, temperature: 0.7 },
  electronics: { max_tokens: 1500, temperature: 0.5 },
  food: { max_tokens: 1000, temperature: 0.6 },
};
WhatsApp Business API Integration
// Required for Zoho CRM sync
interface WhatsAppMessage {
  business_id: string;
  customer_number: string;
  message_type: 'text' | 'image' | 'catalog';
  content: string;
  timestamp: Date;
}

// Catalog sharing via WhatsApp
- Product catalog deep linking
- Image preview generation
- Order status updates
- Customer support integration

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://radiant-catalyst-shop.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/66cba736-0959-4be7-864f-0ae381184338).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
