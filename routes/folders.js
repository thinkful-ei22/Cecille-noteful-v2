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

router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .update({name:`${updateObj.name}`})
    .where('id', `${id}`)
    .then(folder => {
      res.json(folder).status(200).send('OK')
    })
    .catch(err => {
      next(err);
    });
})

module.exports = router;
