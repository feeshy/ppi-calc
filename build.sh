#!/bin/bash
set -e

echo "=== 1. 开始生成 Sitemap ==="
LASTMOD=$(date -u +"%Y-%m-%d")
cat <<EOF > ./sitemap.xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://ppi.feeshy.top/</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="zh" href="https://ppi.feeshy.top/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://ppi.feeshy.top/en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ppi.feeshy.top/"/>
  </url>
  <url>
    <loc>https://ppi.feeshy.top/en</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="zh" href="https://ppi.feeshy.top/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://ppi.feeshy.top/en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ppi.feeshy.top/"/>
  </url>
</urlset>
EOF
echo "Sitemap.xml 生成成功 (最后修改日期: $LASTMOD)"

echo "=== 2. 开始注入 Service Worker 构建时间戳 ==="
BUILD_TIME=$(date +'%Y%m%d%H%M%S')
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i "" "s/BUILD_TIME_PLACEHOLDER/$BUILD_TIME/g" ./service-worker.js
else
  sed -i "s/BUILD_TIME_PLACEHOLDER/$BUILD_TIME/g" ./service-worker.js
fi
echo "Service Worker 时间戳注入成功: $BUILD_TIME"

echo "=== 3. 开始清理构建资产文件 ==="
rm -f README.md LICENSE
rm -rf .github
rm -rf .vscode
echo "不需要公开的资源文件清理成功"

echo "=== 4. 脚本自毁 ==="
rm -f build.sh
echo "build.sh 自毁成功"
