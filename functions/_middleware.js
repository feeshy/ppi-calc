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
    
    // 使用 Response.redirect 生成标准重定向响应，并利用 clone 机制追加 Set-Cookie，以避免部分客户端在 null body 下解析 Location 头异常（ERR_INVALID_REDIRECT）
    const redirectResponse = Response.redirect(cleanUrl.toString(), 302);
    const newResponse = new Response(redirectResponse.body, redirectResponse);
    newResponse.headers.set('Set-Cookie', `lang_pref=${langParam}; Path=/; Max-Age=31536000; SameSite=Lax`);
    return newResponse;
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
      // 无 Cookie 偏好：读取 Accept-Language 判定，只要首选语言不是中文（或者缺失语言头），一律跳转到英文版 /en
      const acceptLang = (request.headers.get('Accept-Language') || '').toLowerCase().trim();
      
      if (!acceptLang.startsWith('zh')) {
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
