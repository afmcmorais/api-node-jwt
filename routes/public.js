import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET

// Cadastro
router.post('/cadastro', async (req, res) => {
    try {
        const user = req.body

        if (!user.password) {
            return res.status(400).json({ message: 'Password is required' })
        }

        const salt = await bcrypt.genSalt(10)
        if (!salt) {
            throw new Error('Failed to generate salt')
        }

        const hashPassword = await bcrypt.hash(user.password, salt)
        if (!hashPassword) {
            throw new Error('Failed to hash password')
        }

        const userDB = await prisma.user.create({
            data: {
                email: user.email,
                name: user.name,
                password: hashPassword,
            },
        })
        res.status(201).json(userDB)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Erro no servidor, tente novamente' })
    }
})

// Login
router.post('/login', async (req, res) => {

    try {
        const userInfo = req.body
        const user = await prisma.user.findUnique({ where: { email: userInfo.email } })

        // Verifica se o usuário existe dentro do banco
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" })
        }

        const isMatch = await bcrypt.compare(userInfo.password, user.password)

        // Compara a senha do banco com a senha que o usuário digitou
        if (!isMatch) {
            return res.status(400).json({ message: "Senha inválida" })
        }

        // Gerar o Token jwt
        const token = jwt.sign({ id: user.id }, JWT_SECRET,{ expiresIn: '1d' })

        res.status(200).json(token)

    } catch (err) {
        res.status(500).json({ message: 'Erro no Servidor, tente novamente' })
    }
})

export default router