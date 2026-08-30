const SITE = "https://aitechpros-website.pages.dev";
const IMAGE = `${SITE}/assets/creative/ai-tech-pros-social-preview.png`;

const PAGES = {
  "/": {
    title: "AI Tech Pros — AI systems that work.",
    description:
      "AI Tech Pros, Inc. connects strategy, secure infrastructure, and human expertise. Parent of MedStore Inc., Negotiate Medical Bill, OrchestrateOS, and Jenkins Cyber Academy.",
  },
  "/projects": {
    title: "Ventures — AI Tech Pros",
    description:
      "The same public ventures listed on henryljenkins.com: AI Tech Pros, Negotiate Medical Bill, and MedStore Inc.",
  },
  "/academy": {
    title: "Jenkins Cyber Academy — AI Tech Pros",
    description:
      "Free live CompTIA Security+ study, hands-on labs, and career support. Join the Henry Jenkins Mentorship community. Practice remains free whether or not you join.",
  },
  "/backoffice": {
    title: "Educator backoffice — AI Tech Pros",
    description:
      "AI Tech Pros Backoffice helps certification educators keep their channels while the network runs distribution, sponsorship operations, and payouts. Member zero: Jenkins Cyber Academy.",
  },
  "/about": {
    title: "Leadership — AI Tech Pros",
    description:
      "AI Tech Pros, Inc. is led by the same CEO and CTO as MedStore Inc.: Nehemiah Harvard and Henry Jenkins.",
  },
  "/conversation": {
    title: "Start a conversation — AI Tech Pros",
    description:
      "Book a 15-minute conversation with AI Tech Pros, Inc. We will help you turn the hard part into a system people can trust.",
  },
  "/privacy": {
    title: "Privacy Policy — AI Tech Pros",
    description:
      "How AI Tech Pros, Inc. collects and uses information on this marketing website and conversation page.",
  },
  "/terms": {
    title: "Terms of Service — AI Tech Pros",
    description:
      "Terms for the AI Tech Pros, Inc. marketing website. Other products publish their own terms.",
  },
};

const SKIP = /^\/(assets|fonts|robots\.txt|sitemap\.xml|_headers|_redirects)/;
const MARKETING_HOST =
  /(^|\.)aitechpros-website\.pages\.dev$|^(www\.)?aitechpros\.(ai|com)$/;
const KNOWN_EXTRA = new Set(["/orchestrateos"]);

function replaceAttr(html, attr, value) {
  const pattern = new RegExp(`(${attr}=")[^"]*(")`, "i");
  return html.replace(pattern, `$1${value}$2`);
}

function isKnownPath(path) {
  return Boolean(PAGES[path]) || KNOWN_EXTRA.has(path) || path.startsWith("/orchestrateos/");
}

async function fetchHomeDocument(context, url) {
  const home = new URL("/", url);
  const assets = context.env && context.env.ASSETS;
  if (assets && typeof assets.fetch === "function") {
    return assets.fetch(new Request(home, context.request));
  }
  return fetch(home.toString(), { headers: { accept: "text/html" } });
}

async function loadSpaDocument(context, url) {
  const response = await context.next();
  const isRedirect = response.status >= 300 && response.status < 400;

  if (response.status === 404) {
    return fetchHomeDocument(context, url);
  }

  if (!isRedirect) {
    return response;
  }

  const location = response.headers.get("location") || "";
  let dest = "";
  try {
    dest = new URL(location, url).pathname.replace(/\/$/, "") || "/";
  } catch {
    dest = "";
  }
  if (dest !== "/" && dest !== "/index.html") {
    return response;
  }

  return fetchHomeDocument(context, url);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (!MARKETING_HOST.test(url.hostname) || SKIP.test(url.pathname)) {
    return context.next();
  }

  const response = await loadSpaDocument(context, url);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) {
    return response;
  }

  const path = url.pathname.replace(/\/$/, "") || "/";
  const known = isKnownPath(path);
  const page = PAGES[path] || {
    title: "Page not found — AI Tech Pros",
    description: "That URL is not part of the AI Tech Pros, Inc. marketing site.",
  };
  const canonical = `${SITE}${path === "/" ? "/" : path}`;
  let html = await response.text();
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`);
  html = replaceAttr(html, 'name="description" content', page.description);
  html = replaceAttr(html, 'property="og:title" content', page.title);
  html = replaceAttr(html, 'property="og:description" content', page.description);
  html = replaceAttr(html, 'property="og:url" content', canonical);
  html = replaceAttr(html, 'property="og:image" content', IMAGE);
  html = replaceAttr(html, 'name="twitter:title" content', page.title);
  html = replaceAttr(html, 'name="twitter:description" content', page.description);
  html = replaceAttr(html, 'rel="canonical" href', canonical);

  const robots = known && PAGES[path] ? "index, follow" : "noindex, nofollow";
  if (/name="robots"/i.test(html)) {
    html = replaceAttr(html, 'name="robots" content', robots);
  } else {
    html = html.replace("</head>", `    <meta name="robots" content="${robots}" />\n  </head>`);
  }

  const headers = new Headers(response.headers);
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(html, { status: known ? 200 : 404, headers });
}
