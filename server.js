const http = require("http")
const url = require("url")
const { parse } = require("querystring")
const fs = require("fs")
const crypto = require("crypto")

const db = require("./db.json")
var html
try {
    html = fs.readFileSync('./index.html', 'utf8')
} catch (e) {
    console.log(e.message)
}

console.log(db.users.length)

const PORT = 3000


function sort(params) {
    let order;
    if (params.direction === 'up') {
        order = 1;
    }
    if (params.direction === 'down') {
        order = -1;
    }

    function compare(a, b) {
        if (a[params.sort] < b[params.sort]) {
            return -1 * order;
        }
        if (a[params.sort] > b[params.sort]) {
            return 1 * order;
        }
        return 0;
    }
    db.users.sort(compare)
}

function showAll(res, params) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    sort(params)
    res.write(html)
    db.users.forEach((item) => {
        res.write("Id: " + item.id + "<br/>")
        res.write("Name: " + item.name + "<br/>")
        res.write("Address: " + item.address + "<br/>")
        res.write("Phone: " + item.phone + "<br/>")
        res.write('<hr>')
    })
    res.write("</body>")
    res.write("</html>")
    res.end()
}


function get(res, field) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    sort(field)
    let conunt = 0
    res.write(html)
    db.users.forEach((item) => {
        if (field.searchField === item.name || field.searchField === item.address) {
            conunt++
            res.write(item.id + "<br/>")
            res.write(item.name + "<br/>")
            res.write(item.address + "<br/>")
            res.write(item.phone + "<br/>")
            res.write('<hr>')
        }
    })

    if (conunt == 0) {
        res.write("<h4>User not found</h4>")
        res.write("</body>")
        res.write("</html>")
        res.end()
    } else {
        res.write("</body>")
        res.write("</html>")
        res.end()
    }

}

function add(res, params) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(html)
    if (params.name == undefined || params.address == undefined || params.phone == undefined) {
        res.write("<h4>Please fill all records</h4>")
        res.write("</body>")
        res.write("</html>")
        res.end()
    } else {
        db.users.push({ id: crypto.randomUUID(), name: params.name, address: params.address, phone: params.phone })
        fs.writeFile('./db.json', JSON.stringify(db), err => {
            if (err) {
                console.log(err)
            } else {
                console.log("DB is written")
            }
        })
        res.write("<h4>User added</h4>")
        res.write("</body>")
        res.write("</html>")
        res.end()
    }
}

function del(res, userInfo) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(html)
    if (userInfo.item === '') {
        res.write("<h4>Please fill all records</h4>")
        res.write("</body>")
        res.write("</html>")
        res.end()
    } else {
        const index = db.users.indexOf(db.users.find((el) => {
            return el.name == userInfo.item || el.id == userInfo.item
        }))
        if (index == -1) {
            res.write("<h4>User not found</h4>")
            res.write("</body>")
            res.write("</html>")
            res.end()
        } else {
            db.users.splice(index, 1)

            fs.writeFile('./db.json', JSON.stringify(db), err => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("DB is written")
                }
            })
            res.write("<h4>User removed</h4>")
            res.write("</body>")
            res.write("</html>")
            res.end()
        }


    }
}

function erase(res) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(html)
    db.users = []
    res.write("<h4>All user removed</h4>")
    res.write("</body>")
    res.write("</html>")
    res.end()

}

http.createServer(
    function (req, res) {
        const urlRequest = url.parse(req.url, true)
        if (req.method == "GET") {
            if (urlRequest.pathname == '/show') {
                console.log(urlRequest.query)
                showAll(res, urlRequest.query)
            }
            if (urlRequest.pathname == '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.write(html)
                res.write("</body>")
                res.write("</html>")
                res.end()
            }
            if (urlRequest.pathname == '/find') {
                console.log(urlRequest.query)
                get(res, urlRequest.query)
            }

        }
        if (req.method == "POST") {
            console.log("POST")
            if (urlRequest.pathname == '/add') {
                console.log(urlRequest)
                let body = '';
                req.on('data', chunk => body += chunk.toString())
                req.on('end', () => {
                    let params = parse(body)
                    console.log(params)
                    add(res, params)
                })
            }
            if (urlRequest.pathname == '/del') {
                console.log(urlRequest)
                let body = '';
                req.on('data', chunk => body += chunk.toString())
                req.on('end', () => {
                    let item = parse(body)
                    console.log(item)
                    del(res, item)
                })
            }
            if (urlRequest.pathname == '/erase') {
                console.log(urlRequest)
                let body = '';
                req.on('data', chunk => body += chunk.toString())
                req.on('end', () => {
                    let item = parse(body)
                    console.log(item)
                    erase(res)
                })
            }
        }

    }
).listen(PORT, () => {
    console.log(`server started on port ${PORT}...`)
})

