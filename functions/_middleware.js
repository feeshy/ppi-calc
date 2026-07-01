export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  const pathname = url.pathname;

  // 1. 允许 Service Worker 预缓存时绕过重定向，直接获取干净的物理文件
  if (url.searchParams.has('sw-bypass')) {
    return await next();
  }

  // 2. 爬虫判定：如果检测到搜索引擎爬虫，一律不进行任何跳转，以 100% 保证页面收录
  const isBot = /bot|spider|crawl|slurp|lighthouse|chrome-lighthouse|google|baidu|bing|msn|yandex|sogou|exabot|ia_archiver/i.test(userAgent);
  if (isBot) {
    return await next();
  }


  // 2. 首页语言路由：首次访问根路径时根据 Cookie 偏好或 Accept-Language 进行首访分流
  if (pathname === '/' || pathname === '/index.html') {
    const cookieHeader = request.headers.get('Cookie') || '';
    let langPref = null;
    const cookies = cookieHeader.split(';');
    for (let cookie of cookies) {
      const [name, val] = cookie.trim().split('=');
      if (name === 'lang_pref') {
        langPref = val;
        break;
      }
    }

    if (langPref) {
      // 存在 Cookie 偏好：偏好 en 则跳转到 /en
      if (langPref === 'en') {
        return Response.redirect(new URL('/en', request.url).toString(), 302);
      }
    } else {
      // 无 Cookie：读取 Accept-Language，如果首选语言非中文，跳转到 /en
      const acceptLang = (request.headers.get('Accept-Language') || '').toLowerCase().trim();
      if (!acceptLang.startsWith('zh')) {
        return Response.redirect(new URL('/en', request.url).toString(), 302);
      }
    }
  }



  // 3. 执行后续请求（获取静态资产）
  const response = await next();

  // 4. 子页面访问偏好更新：用户正常访问页面后，静默在响应头中更新其 Cookie 偏好
  if (response.status === 200) {
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/html')) {
      const newResponse = new Response(response.body, response);
      if (pathname === '/' || pathname === '/index.html') {
        newResponse.headers.set('Set-Cookie', 'lang_pref=zh; Path=/; Max-Age=31536000; SameSite=Lax');
      } else if (pathname === '/en' || pathname === '/en.html' || pathname.startsWith('/en/')) {
        newResponse.headers.set('Set-Cookie', 'lang_pref=en; Path=/; Max-Age=31536000; SameSite=Lax');
      }
      return newResponse;
    }
  }

  return response;
}
