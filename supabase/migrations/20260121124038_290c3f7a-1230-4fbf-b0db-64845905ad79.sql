-- Create Business Resources category
INSERT INTO categories (name, slug, description, sort_order, is_active)
VALUES (
  'Business Resources',
  'business-resources',
  'Business plans, funding guides, and agricultural resources for dragon fruit farmers seeking investment and expansion',
  15,
  true
);

-- Insert Business Plan Products
INSERT INTO products (sku, name, slug, short_description, description, category_id, price_zar, stock_quantity, is_active, is_featured, allow_backorder)
VALUES 
-- Starter Business Plan
(
  'BP-STARTER-001',
  'Dragon Fruit Farming Starter Business Plan',
  'starter-business-plan',
  'Complete business plan template for small-scale dragon fruit farming operations (0.5-2 hectares)',
  '<h3>Perfect for New Farmers Starting Small</h3>
  <p>This comprehensive business plan is designed for aspiring dragon fruit farmers looking to start with a manageable operation. Ideal for those seeking funding from local banks, agricultural development corporations, or microfinance institutions.</p>
  
  <h4>What''s Included:</h4>
  <ul>
    <li><strong>Executive Summary Template</strong> - Professionally crafted introduction to your farming venture</li>
    <li><strong>Market Analysis</strong> - South African dragon fruit market data, pricing trends, and demand forecasts</li>
    <li><strong>Financial Projections</strong> - 5-year cash flow, income statements, and break-even analysis</li>
    <li><strong>Startup Cost Breakdown</strong> - Detailed equipment, infrastructure, and planting material costs</li>
    <li><strong>Operational Plan</strong> - Planting schedules, maintenance calendars, and harvest planning</li>
    <li><strong>Risk Assessment</strong> - Common challenges and mitigation strategies</li>
    <li><strong>Funding Application Guide</strong> - Tips for approaching lenders and investors</li>
  </ul>
  
  <h4>Suitable For:</h4>
  <ul>
    <li>Land Reform beneficiaries</li>
    <li>Emerging farmers</li>
    <li>Backyard commercial growers</li>
    <li>Agricultural cooperative members</li>
  </ul>
  
  <p><strong>Format:</strong> Digital download (PDF + Editable Word document)</p>
  <p><strong>Support:</strong> 1-hour consultation call included to customize for your operation</p>',
  (SELECT id FROM categories WHERE slug = 'business-resources'),
  2500,
  999,
  true,
  true,
  true
),

-- Commercial Business Plan
(
  'BP-COMMERCIAL-001',
  'Commercial Dragon Fruit Farm Business Plan',
  'commercial-business-plan',
  'Professional-grade business plan for medium to large-scale operations (2-10 hectares) seeking significant investment',
  '<h3>Designed for Serious Agricultural Investment</h3>
  <p>A comprehensive, investor-ready business plan tailored for commercial dragon fruit farming operations. This plan meets the requirements of major agricultural development banks, private equity investors, and government funding programs.</p>
  
  <h4>What''s Included:</h4>
  <ul>
    <li><strong>Detailed Executive Summary</strong> - Investment highlights and ROI projections</li>
    <li><strong>Comprehensive Market Research</strong> - Local, regional, and export market analysis</li>
    <li><strong>10-Year Financial Model</strong> - Full P&L, cash flow, balance sheets, and sensitivity analysis</li>
    <li><strong>Infrastructure Planning</strong> - Irrigation systems, trellis designs, packhouse requirements</li>
    <li><strong>Workforce Planning</strong> - Staffing needs, training programs, and labor cost projections</li>
    <li><strong>Export Readiness Assessment</strong> - GlobalGAP compliance roadmap and export protocols</li>
    <li><strong>Environmental Impact Statement</strong> - Water usage, sustainability practices</li>
    <li><strong>SWOT Analysis</strong> - Detailed strategic analysis</li>
    <li><strong>Implementation Timeline</strong> - Month-by-month development milestones</li>
  </ul>
  
  <h4>Funding Sources This Plan Targets:</h4>
  <ul>
    <li>Land Bank of South Africa</li>
    <li>Industrial Development Corporation (IDC)</li>
    <li>Department of Agriculture grants</li>
    <li>Private agricultural investors</li>
    <li>Commercial banks (Absa, Standard Bank, FNB)</li>
  </ul>
  
  <p><strong>Format:</strong> Digital download + Printed bound copy</p>
  <p><strong>Support:</strong> 3-hour consultation + bank presentation coaching</p>',
  (SELECT id FROM categories WHERE slug = 'business-resources'),
  8500,
  999,
  true,
  true,
  true
),

-- Enterprise Business Plan
(
  'BP-ENTERPRISE-001',
  'Enterprise Dragon Fruit Agribusiness Plan',
  'enterprise-business-plan',
  'Complete agribusiness development plan for large-scale operations (10+ hectares) and agricultural enterprises',
  '<h3>Enterprise-Level Agricultural Investment Package</h3>
  <p>The ultimate business planning resource for serious agribusiness ventures. This comprehensive package is designed for large-scale dragon fruit farming operations, cooperatives, and agricultural enterprises seeking major capital investment.</p>
  
  <h4>Complete Package Includes:</h4>
  <ul>
    <li><strong>Full Feasibility Study</strong> - Technical, financial, and market feasibility assessment</li>
    <li><strong>Detailed Business Plan</strong> - 50+ page professional document</li>
    <li><strong>Financial Models</strong> - 15-year projections with multiple scenarios</li>
    <li><strong>Due Diligence Pack</strong> - All documentation investors require</li>
    <li><strong>Land & Climate Assessment</strong> - Site-specific growing condition analysis</li>
    <li><strong>Value Chain Integration</strong> - Processing, packaging, and distribution planning</li>
    <li><strong>Employment Creation Projections</strong> - For government grant applications</li>
    <li><strong>B-BBEE Scorecard Optimization</strong> - Maximize empowerment credentials</li>
    <li><strong>Risk Management Framework</strong> - Insurance, hedging, and contingency planning</li>
  </ul>
  
  <h4>Additional Services:</h4>
  <ul>
    <li>On-site farm assessment visit</li>
    <li>5 hours of consultation</li>
    <li>Investor pitch deck creation</li>
    <li>Bank meeting accompaniment (Gauteng/KZN)</li>
  </ul>
  
  <p><strong>Typical Funding Amounts:</strong> R5 million - R50 million+</p>
  <p><strong>Success Rate:</strong> 85% of our enterprise clients secure funding</p>',
  (SELECT id FROM categories WHERE slug = 'business-resources'),
  25000,
  999,
  true,
  true,
  true
),

-- SA Funding Directory
(
  'FG-SAFUNDING-001',
  'South African Agricultural Funding Directory 2024',
  'sa-agricultural-funding-directory',
  'Comprehensive guide to 50+ funding sources for South African farmers including grants, loans, and subsidies',
  '<h3>Your Complete Guide to Agricultural Funding in South Africa</h3>
  <p>Stop searching endlessly for funding opportunities. This comprehensive directory lists every major funding source available to South African farmers, complete with eligibility criteria, application processes, and contact details.</p>
  
  <h4>Funding Sources Covered:</h4>
  <ul>
    <li><strong>Government Grants</strong>
      <ul>
        <li>CASP (Comprehensive Agricultural Support Programme)</li>
        <li>MAFISA (Micro Agricultural Financial Institutions of South Africa)</li>
        <li>Land Reform grants</li>
        <li>Provincial agriculture department programs</li>
      </ul>
    </li>
    <li><strong>Development Finance</strong>
      <ul>
        <li>Land Bank products</li>
        <li>IDC agricultural funding</li>
        <li>SEFA (Small Enterprise Finance Agency)</li>
      </ul>
    </li>
    <li><strong>Commercial Options</strong>
      <ul>
        <li>Agricultural merchant banks</li>
        <li>Asset-based finance</li>
        <li>Agricultural insurance products</li>
      </ul>
    </li>
    <li><strong>Alternative Funding</strong>
      <ul>
        <li>Agricultural crowdfunding platforms</li>
        <li>Impact investors</li>
        <li>Cooperative funding models</li>
      </ul>
    </li>
  </ul>
  
  <h4>For Each Funding Source:</h4>
  <ul>
    <li>Eligibility requirements</li>
    <li>Funding amounts available</li>
    <li>Interest rates/terms</li>
    <li>Application process</li>
    <li>Required documentation</li>
    <li>Contact details & office locations</li>
    <li>Success tips from approved applicants</li>
  </ul>
  
  <p><strong>Bonus:</strong> Application template pack included</p>
  <p><strong>Updates:</strong> Free quarterly updates for 1 year</p>',
  (SELECT id FROM categories WHERE slug = 'business-resources'),
  1500,
  999,
  true,
  true,
  true
),

-- African Funding Guide
(
  'FG-AFRICA-001',
  'Pan-African Agricultural Funding Guide',
  'pan-african-funding-guide',
  'Funding opportunities across 15 African countries for dragon fruit and tropical fruit farming ventures',
  '<h3>Expand Your Horizons with African Funding</h3>
  <p>Africa is experiencing an agricultural investment boom. This guide covers funding opportunities across the continent for dragon fruit farming ventures.</p>
  
  <h4>Countries Covered:</h4>
  <p>South Africa, Kenya, Tanzania, Uganda, Ghana, Nigeria, Rwanda, Zambia, Zimbabwe, Mozambique, Namibia, Botswana, Malawi, Ethiopia, Egypt</p>
  
  <h4>Funding Categories:</h4>
  <ul>
    <li><strong>African Development Bank Programs</strong> - Feed Africa initiative, ENABLE Youth</li>
    <li><strong>International Development Partners</strong> - USAID, UK Aid, GIZ, AFD programs</li>
    <li><strong>Regional Development Banks</strong> - DBSA, TDB, PTA Bank</li>
    <li><strong>Climate Finance</strong> - Green Climate Fund, Adaptation Fund</li>
    <li><strong>Impact Investment Funds</strong> - AgDevCo, Root Capital, &Beyond</li>
    <li><strong>Country-Specific Programs</strong> - National agricultural development funds</li>
  </ul>
  
  <h4>Special Sections:</h4>
  <ul>
    <li>Cross-border farming enterprises</li>
    <li>Export-oriented project funding</li>
    <li>Youth in agriculture programs</li>
    <li>Women farmer initiatives</li>
    <li>Climate-smart agriculture grants</li>
  </ul>
  
  <p><strong>Format:</strong> 120-page digital guide</p>
  <p><strong>Language:</strong> English with French summary sections</p>',
  (SELECT id FROM categories WHERE slug = 'business-resources'),
  3500,
  999,
  true,
  false,
  true
),

-- Complete Funding Bundle
(
  'BP-BUNDLE-001',
  'Dragon Fruit Farming Success Bundle',
  'dragon-fruit-farming-success-bundle',
  'Complete package: Commercial business plan + SA Funding Directory + African Funding Guide + 5 hours consultation',
  '<h3>Everything You Need to Secure Funding</h3>
  <p>Our most comprehensive package combines all the resources you need to successfully fund your dragon fruit farming venture. Save over R6,000 compared to buying individually!</p>
  
  <h4>Bundle Includes:</h4>
  <ul>
    <li>✅ Commercial Dragon Fruit Farm Business Plan (R8,500 value)</li>
    <li>✅ South African Agricultural Funding Directory 2024 (R1,500 value)</li>
    <li>✅ Pan-African Agricultural Funding Guide (R3,500 value)</li>
    <li>✅ 5 Hours Personal Consultation (R5,000 value)</li>
    <li>✅ Investor Pitch Deck Template (R2,000 value)</li>
    <li>✅ Financial Model Spreadsheets (R1,500 value)</li>
  </ul>
  
  <h4>Bonus Items:</h4>
  <ul>
    <li>🎁 Dragon Fruit Farming Technical Manual</li>
    <li>🎁 First-year growing calendar</li>
    <li>🎁 Supplier contact directory</li>
    <li>🎁 Priority support access</li>
  </ul>
  
  <h4>Total Value: R22,000</h4>
  <h4>Bundle Price: R15,000</h4>
  
  <p><strong>Perfect for:</strong> Farmers serious about scaling their dragon fruit operation with proper funding and support.</p>
  
  <p><em>"This bundle gave me everything I needed. I secured R2.5 million from Land Bank within 3 months!" - Thabo M., Limpopo</em></p>',
  (SELECT id FROM categories WHERE slug = 'business-resources'),
  15000,
  999,
  true,
  true,
  true
),

-- Financial Template Pack
(
  'FT-TEMPLATES-001',
  'Dragon Fruit Farm Financial Templates',
  'financial-templates-pack',
  'Excel spreadsheets for budgeting, cash flow, crop planning, and profitability analysis',
  '<h3>Professional Financial Planning Tools</h3>
  <p>Take control of your farm finances with our professionally designed Excel templates specifically created for dragon fruit farming operations.</p>
  
  <h4>Templates Included:</h4>
  <ul>
    <li><strong>Startup Budget Calculator</strong> - Plan your initial investment</li>
    <li><strong>Monthly Cash Flow Tracker</strong> - Monitor income and expenses</li>
    <li><strong>Harvest Yield Projector</strong> - Estimate production by variety</li>
    <li><strong>Break-Even Analysis</strong> - Know when you''ll become profitable</li>
    <li><strong>Price Calculator</strong> - Determine optimal selling prices</li>
    <li><strong>Labor Cost Planner</strong> - Staff and seasonal worker budgeting</li>
    <li><strong>Input Cost Tracker</strong> - Monitor fertilizer, pesticide costs</li>
    <li><strong>ROI Calculator</strong> - Return on investment projections</li>
    <li><strong>Loan Repayment Schedule</strong> - Track funding obligations</li>
    <li><strong>Comparative Variety Analysis</strong> - Compare profitability by cultivar</li>
  </ul>
  
  <h4>Features:</h4>
  <ul>
    <li>Pre-populated with South African cost data</li>
    <li>Automatic calculations and charts</li>
    <li>Print-ready reports for bank submissions</li>
    <li>Video tutorials included</li>
  </ul>
  
  <p><strong>Compatibility:</strong> Microsoft Excel, Google Sheets</p>',
  (SELECT id FROM categories WHERE slug = 'business-resources'),
  950,
  999,
  true,
  false,
  true
);