'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');

router.get('/', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .first('id', 'name')
    .from('folders')
    .modify(function (queryBuilder) {
      if (id) {
        queryBuilder.where('folders.id', `${id}`)
      }
    })
    .then(folder => {
      if (`!${id}`) {
        res.json(folder);
        res.status(200).send('OK');
      } else {
        res.status(404).send('NOT FOUND');
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
