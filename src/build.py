# Builds the Claude artifact page and the installable web app from engine.js + ui.html
import shutil, os
ui = open('ui.html').read(); en = open('engine.js').read()
game = ui.replace('/*ENGINE*/', en)
open('mint-condition.html', 'w').write(game)
head = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2A4BD4">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Mint">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>
'''
i = game.index('<div class="wrap">')
doc = head + game[:i] + '</head>\n<body>\n' + game[i:] + '''
<script>if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });</script>
</body>
</html>
'''
repo = '/home/claude/mint-condition'
open(repo + '/index.html', 'w').write(doc)
os.makedirs(repo + '/src', exist_ok=True)
for f in ['engine.js', 'ui.html', 'sim.js', 'build.py']: shutil.copy(f, repo + '/src/' + f)
# bump the offline cache so phones pick up the new version
sw = open(repo + '/sw.js').read()
import re
v = int(re.search(r"mint-v(\d+)", sw).group(1)) + 1
open(repo + '/sw.js', 'w').write(re.sub(r"mint-v\d+", 'mint-v%d' % v, sw))
print('built, cache v%d' % v)
