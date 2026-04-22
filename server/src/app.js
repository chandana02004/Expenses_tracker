import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import authRoutes from './routes/auth.routes.js'
import expenseRoutes from './routes/expense.routes.js'
import categoryRoutes from './routes/category.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import errorMiddleware from './middleware/error.middleware.js'

const app = express()

app.use(helmet())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5001'],
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(errorMiddleware)

export default app
