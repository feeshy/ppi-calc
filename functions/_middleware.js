export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  const pathname = url.pathname;

  // 1. 爬虫判定：如果检测到搜索引擎爬虫，一律不进行任何跳转，以 100% 保证页面收录
  const isBot = /bot|spider|crawl|slurp|lighthouse|chrome-lighthouse|google|baidu|bing|msn|yandex|sogou|exabot|ia_archiver/i.test(userAgent);
  if (isBot) {
    return await next();
  }

  // 2. 手动切换检测：如果请求的 URL 中带有 ?lang=... 参数，拦截并更新 Cookie 偏好，然后重定向至干净 URL
  const langParam = url.searchParams.get('lang');
  if (langParam) {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete('lang');
    
    // 返回重定向响应，并在 headers 中写入新的偏好 Cookie
    return new Response(null, {
      status: 302,
      headers: {
        'Location': cleanUrl.toString(),
        'Set-Cookie': `lang_pref=${langParam}; Path=/; Max-Age=31536000; SameSite=Lax`
      }
    });
  }

  // 3. 首页语言路由：当访问根路径时，检查 Cookie 偏好或 Accept-Language 进行首访分流
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
      // 存在 Cookie 偏好：如果偏好为 en 则重定向；如果是默认 zh 则保持在首页
      if (langPref === 'en') {
        return Response.redirect(new URL('/en', request.url).toString(), 302);
      }
    } else {
      // 无 Cookie 偏好：读取 Accept-Language 并判定是否为非中文用户
      const acceptLang = (request.headers.get('Accept-Language') || '').toLowerCase().trim();
      
      // 如果 Accept-Language 存在且不以 'zh' 开头（即非中文用户），则重定向到英文版 /en
      if (acceptLang && !acceptLang.startsWith('zh')) {
        return Response.redirect(new URL('/en', request.url).toString(), 302);
      }
    }
  }

  // 4. 执行后续请求（获取静态资产）
  const response = await next();

  // 5. 子页面访问偏好更新：用户正常访问页面后，静默在响应头中更新其 Cookie 偏好
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
