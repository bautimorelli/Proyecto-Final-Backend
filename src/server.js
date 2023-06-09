import express from "express"
import passport from "passport"
import { __dirname } from "./util.js"
import cluster from "cluster"
import os from "os"
import session from "./config/sessionConfig.js"
import { apiRouter } from "./routes/index.js"
import { options } from "./config/dbConfig.js"
import { logger } from "./services/logger/logger.js"
import { routeLogger } from "./services/middleware/routeLogger.js"

//.....Config Argumentos
const PORT = options.server.PORT
const MODE = options.server.MODE

//.....Express server
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//.....Session config
app.use(session)

//.....Passport
app.use(passport.initialize())
app.use(passport.session())

//.....Routes
app.use(routeLogger, apiRouter)

//.....Cluster
if (MODE === "CLUSTER" && cluster.isPrimary) {
	const cpuAmount = os.cpus().length
	logger.info(`Cantidad de nucleos: ${cpuAmount}`)
	for (let index = 0; index < cpuAmount; index++) {
		cluster.fork()
	}
	cluster.on("exit", (worker) => {
		logger.info(`El proceso ${worker.process.pid} ha dejado de funcionar`)
		cluster.fork()
	})
} else {
	const server = app.listen(PORT, () =>
		logger.info(
			`http://localhost:${PORT} - Server listening on port ${PORT} on process ${process.pid}`
		)
	)
	server.on("error", (error) => logger.error(`Error in server ${error}`))
}

export { app }
