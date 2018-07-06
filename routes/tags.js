'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');

router.get('/', (req, res, next) => {
  knex.select('id', 'name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex ('tags')
    .insert(newItem)
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`http://${req.headers.host}/tags/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

module.exports = router;
