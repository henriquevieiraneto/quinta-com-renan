const express = require('express');
const router = express.Router();
const userService = require('../service/userService');

router.get('/', async (req, res) => {
    const users = await userService.getAllusers();
    res.json(users);
});

router.get('/:id', async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    if(user) res.json(user);
    else res.status(404).json({menssage: 'Usuario não encomtrado'});
});

router.post('/', async (req, res) => {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
});

router.delete('/:id', async (req, res) => {
    await userService.deletar(req.params.id);
    res.json({message: 'usuario deleta '});
});

module.exports = router