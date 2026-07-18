# Custom Agent Rules: SEO, Performance & UX Checklist

This file contains custom instructions and guidelines for building, modifying, and templates in this workspace. These rules must be strictly adhered to.

---

## 📑 Semantic HTML & Structure (اسٹرکچر اور سیمنٹک ایچ ٹی ایم ایل)

1. **Single H1 Rule**: 
   - Each page/URL must render exactly one `<h1>` tag. Never use multiple `<h1>` elements on a single page.
   - ہر سنگل URL/پیج پر صرف ایک ہی `<h1>` ٹیگ رینڈر ہونا چاہیے۔

2. **Heading Hierarchy**: 
   - Headings must follow a strict sequential hierarchy (e.g., `<h2>` must be followed by `<h3>`, never jump from `<h2>` directly to `<h4>`).
   - ہیڈنگز کا سیکوئنس بالکل ٹھیک ہونا چاہیے (مثلاً `<h2>` کے بعد ہی `<h3>` آئے، جمپ نہ کرے)۔

3. **Automated Canonical Tags**: 
   - Every page must automatically generate a self-referential absolute canonical link in its `<head>` section: `<link rel="canonical" href="[Absolute URL]" />`.
   - ہر پیج کے `<head>` میں خود بخود اس پیج کا ابسولیوٹ (absolute) Self-Referential canonical لنک جنریٹ ہو۔

4. **Dynamic Meta Control**: 
   - A variable/input system must be present in the routing controller or admin templates to inject a unique Title Tag and Meta Description for each page.
   - ہر پیج کے لیے منفرد Title اور Meta Description انجیکٹ کرنے کا سسٹم ہونا چاہیے۔

5. **Semantic Layout Tags**: 
   - Use layout-specific HTML5 semantic tags (`<header>`, `<nav>`, `<main>`, `<footer>`) instead of generic `<div>` tags for layout sections.
   - ہیڈر، نیویگیشن، مین اور فوٹر کے لیے `<div>` کے بجائے سیمنٹک ٹیگز استعمال کریں۔

---

## ⚡ Technical Performance & Speed (ٹیکنیکل کارکردگی اور اسپیڈ)

1. **Next-Gen Image Format**: 
   - Convert and compress all uploaded/used images to next-gen formats like WebP or AVIF automatically.
   - تمام امیجز کو WebP یا AVIF فارمیٹ میں کنورٹ اور کمپریس کریں۔

2. **Native Lazy Loading**: 
   - Every image in the content area must default to native lazy loading with `loading="lazy"`.
   - ہر امیج پر ڈیفالٹ `loading="lazy"` کا ایٹریبیوٹ اپلائی ہو۔

3. **Explicit Image Dimensions**: 
   - Specify explicit `width` and `height` attributes on image tags to prevent layout shifts (CLS - Cumulative Layout Shift).
   - امیج ٹیگ میں چوڑائی (width) اور اونچائی (height) لازمی ہونی چاہیے تاکہ لے آؤٹ شفٹ نہ ہو۔

4. **Asset Minification**: 
   - Ensure all CSS, JS, and HTML files are minified during production builds.
   - پروڈکشن بلڈ کے وقت تمام اثاثے (Assets) منی فائی (minify) ہوں۔

5. **Font Display Swap**: 
   - Always include `font-display: swap;` inside `@font-face` declarations in CSS to prevent layout and loading text hideouts.
   - فونٹ فیس میں `font-display: swap;` کا استعمال لازمی کریں۔

---

## 🔗 URL & Routing Architecture (یو آر ایل اور روٹنگ آرکیٹیکچر)

1. **SEO-Friendly URLs**: 
   - Generate URLs automatically using lowercase, alphanumeric characters, and hyphens `-` only (e.g., `/my-new-product`).
   - یو آر ایل صرف لوئر کیس، الفانیومیرک اور ہائفنز سے مل کر بننے چاہئیں۔

2. **Trailing Slash Enforcement**: 
   - Enforce trailing slash policy (either all with slash or all without) and handle 301 redirects to ensure no duplicate content/links are served.
   - یو آر ایل کے آخر میں سلیش `/` کی یکسانیت ہو اور سرور 301 ری ڈائریکٹ کرے تاکہ ڈوپلیکیٹ لنکس نہ بنیں۔

3. **Automatic Sitemap Generator**: 
   - Automatically update `sitemap.xml` dynamically whenever a new page or product is published.
   - ہر نیا پیج پبلش ہونے پر `sitemap.xml` خود بخود اپ ڈیٹ ہو۔

4. **Clean Robots.txt**: 
   - Ensure a clean, dynamic, or static `robots.txt` exists in the root directory with standard directives.
   - روٹ ڈائریکٹری میں روبوٹس فائل لازمی ہونی چاہیے۔

---

## 📱 UX & Modern Standards (یو ایکس اور جدید معیارات)

1. **Mobile-First Responsiveness**: 
   - Prevent horizontal scrollbars and ensure all elements, including tables, code blocks, and popups, wrap properly on mobile viewports.
   - لے آؤٹ موبائل فرسٹ ہو اور کوئی ہوریزونٹل اسکرول نہ ہو۔

2. **JSON-LD Schema Injection**: 
   - Inject structured schema data (Organization / Product / Breadcrumb / etc.) using JSON-LD in the template's head.
   - ٹیمپلیٹ میں dynamic JSON-LD بلاک کوڈ موجود ہونا چاہیے۔

3. **SSL/HTTPS Force**: 
   - Redirect all HTTP requests to HTTPS via permanent 301 redirects at the server layer.
   - تمام HTTP ٹریفک کو 301 ری ڈائریکٹ کے ذریعے HTTPS پر فورس کریں۔

4. **Custom 404 Routing**: 
   - Have a dedicated 404 handler page with links back to the home page or helpful navigation.
   - کسٹم 404 پیج ہونا چاہیے جہاں سے یوزر ہوم پیج پر واپس جا سکے۔

5. **Analytics Code Injections**: 
   - Provide reserved slots/code blocks for injecting scripts (like Google Tag Manager, GA4) inside `<head>` and `<body>` start tags.
   - اینالیٹکس کوڈز (GTM / GA4) کے لیے مخصوص انجیکشن بلاکس ہوں۔
