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

router.get('/:id', (req, res, next) => {
  const { id } = req.params;

  knex
    .first('id', 'name')
    .from('tags')
    .modify(function (queryBuilder) {
      if (id) {
        queryBuilder.where('tags.id', `${id}`)
      }
    })
    .then(result => {
      if (`!${id}`) {
        res.json(result);
        res.status(200);
      } else {
        res.status(404);
      }
    })
    .catch(err => {
      next(err);
    });
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

router.put('/:id', (req, res, next) => {
  const { id } = req.params;

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

  knex('tags')
    .update({name:`${updateObj.name}`})
    .where('id', `${id}`)
    .then(tag => {
      res.json(tag).status(200)
    })
    .catch(err => {
      next(err);
    });
})

module.exports = router;
