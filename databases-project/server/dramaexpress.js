import express from "express"
import mysql from "mysql"
import bodyParser from "body-parser"
import cors from "cors"
import crypto from "crypto"
import jwt from "jsonwebtoken"

const app = express()
const port = 3010

const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '1234',
	database: 'dramadb'
})

db.connect()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.json({result: "success"})
})

app.get('/dramas', (req, res) => {
	const sql = 'select * from dramas'
  
	db.query(sql, (err, rows) => {
		if (err) {
			res.json({result: "error"})
			return console.log(err)
		}
		res.json(rows)
	})
})

app.get('/dramas/:drama_id', (req, res) => {
  const { drama_id } = req.params;

	const sql = `SELECT * FROM Info WHERE drama_id = ${drama_id}`;

  db.query(sql, (err, rows) => {
    if (err) {
      res.json({ result: "error" });
      return console.log(err);
    }

    if (rows.length === 0) {
      res.json({ result: "데이터가 없티비" });
    } else {
      const drama = rows[0];

      const info = {
        drama_id: drama.drama_id,
      	plot: drama.plot,
      	viewership_rate: drama.viewership_rate
      };
			
      res.json(info);
    }
  });
});

app.get('/:dramaId/reviews', (req, res) => {
  const dramaId = req.params.dramaId; // 클라이언트에서 전달한 드라마 ID

  const sql = `SELECT * FROM UserReviews WHERE drama_id = ${dramaId}`;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send({ message: '리뷰 목록을 가져오는 데 실패했습니다.' });
    } else {
      res.send(rows);
    }
  });
});



app.post('/api/Login', (req, res) => {
	const email = req.body.email;
	const pw = req.body.password;
	const sql = "SELECT salt, password from Users WHERE email = '" + email + "';"

  db.query(sql, function (err, rows) {
    if (err) throw err ;
		else {
      if (rows.length === 0) {
				console.log("아이디 틀려버림 티비")
				res.send("ID오류");
			}
			else {
				const salt = rows[0].salt;
				const password = rows[0].password;
				const hashPassword = crypto.createHash('sha512').update(pw + salt).digest('hex');
				
				if(password === hashPassword) {
					console.log("로그인 성공")
					// const token = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });
					// res.cookie("token", token, {
					// 	expires: new Date(Date.now() + 900000),
					// 	httpOnly: true
					// });
					res.send("성공");
				}
				else {
					console.log("로그인 비번 틀려버림 티비")
					res.send("pw오류");
				}
			}
    }
  });
});

app.post('/api/Signup', function (req, res) {
	const name = req.body.name;
	const email = req.body.email;
	const password = req.body.password;
	const salt = Math.round((new Date().valueOf() * Math.random())) + "";
	const hashPassword = crypto.createHash('sha512').update(password + salt).digest('hex');
  const sql = "SELECT email FROM Users where email='" + email + "'"; // 중복 처리를 위한 쿼리
	
	db.query(sql, function (err, rows) {
		if(rows.length === 0) {
			const mysql = {
				username: name,
				email: email,
				password: hashPassword,
				salt: salt
			};
			
			const query = db.query('insert into Users set ?', mysql, function (err, rows) {
				if (err) throw err;
				else {
					res.send("성공");
				}
			})
		} else {
			res.send("중복ID");
		}
	});
});

app.post('/reviews', (req, res) => {
  const { drama_id, user_id, review, rating } = req.body;

	console.log(user_id);
	
  const insertQuery = `INSERT INTO UserReviews (drama_id, user_id, review, rating) VALUES (?, ?, ?, ?)`;
  const values = [drama_id, user_id, review, rating];
	
  db.query(insertQuery, values, (error, results) => {
    if (error) {
      console.error('리뷰 저장 실패 티비:', error);
      return res.send("리뷰 실패");
    }

    // 리뷰가 성공적으로 저장되었을 경우
    console.log('리뷰 저장 성공 티비');
    return res.send("리뷰 성공");
  });
});

app.listen(port, () => {
  console.log(`서버 실행됨 (port ${port})`)
});