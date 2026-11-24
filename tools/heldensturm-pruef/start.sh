#!/bin/bash
pkill -f "electron" 2>/dev/null; sleep 1
cd /home/claude/imres-tales-public/desktop
(xvfb-run -a -s "-screen 0 1920x1080x24" npx electron . --no-sandbox --fenster --ohne-update --remote-debugging-port=9222 "$@" > /tmp/t/el.log 2>&1 &)
sleep 13
