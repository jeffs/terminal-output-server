cargo --color=always --quiet run 0 `seq 31` >& server/cargo.out 
cd server
echo '<meta charset="utf-8"><pre>' > temp.html
./node_modules/ansi-to-html/bin/ansi-to-html cargo.out >> temp.html
echo '</pre>' >> temp.html
mv temp.html output.html
