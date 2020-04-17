cargo --color=always --quiet run 0 `seq 31` >& server/cargo.out 
status=$?

cd server

cat >temp.html <<EOF
<meta charset="utf-8">
<style>
body {
    background-color: #333;
    color: #EDD;
}
table {
    border-collapse: collapse;
    table-layout: fixed;
}
td, th {
    border: 1px solid black;
    padding: 1rem;
}
</style>
EOF

if [ $status = 0 ] && grep -q '<.*>' cargo.out; then
    ./node_modules/ansi-to-html/bin/ansi-to-html cargo.out >> temp.html
else
    cat >>temp.html <<EOF
<pre>
$(./node_modules/ansi-to-html/bin/ansi-to-html cargo.out)
</pre>
EOF
fi

mv temp.html output.html
