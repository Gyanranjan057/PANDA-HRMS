 

import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors(), express.json())
app.use((e, req, res, next) => { console.error(e); res.status(500).json({ message: e.message }) })
app.listen(process.env.PORT, () => console.log('HRMS API on port ' + process.env.PORT))