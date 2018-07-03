'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

const knex = require('../knex');

// Get All (and search by query) ------------OLD VERSION
// router.get('/', (req, res, next) => {
//   const { searchTerm } = req.query;
//
//   notes.filter(searchTerm)
//     .then(list => {
//       res.json(list);
//     })
//     .catch(err => {
//       next(err);
//     });
// });

router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;

  knex.select('id', 'title', 'content')
    .from('notes')
    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      res.json(results);
      res.status(200).send('OK')
    })
    .catch(err => {
      next(err);
    });
});

// Get a single item ------------------------OLD VERSION
// router.get('/:id', (req, res, next) => {
//   const id = req.params.id;
//
//   notes.find(id)
//     .then(item => {
//       if (item) {
//         res.json(item);
//       } else {
//         next();
//       }
//     })
//     .catch(err => {
//       next(err);
//     });
// });

router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .first('id', 'title', 'content')
    .from('notes')
    .modify(function (queryBuilder) {
      if (id) {
        queryBuilder.where('notes.id', `${id}`)
      }
    })
    .then(note => {
      res.json(note)
      res.status(200).send('OK')
    })
    .catch(err => {
      next(err);
    });
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  notes.update(id, updateObj)
    .then(item => {
      if (item) {
        res.json(item);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Post (insert) an item------------------------OLD VERSION
// router.post('/', (req, res, next) => {
//   const { title, content } = req.body;
//
//   const newItem = { title, content };
//   /***** Never trust users - validate input *****/
//   if (!newItem.title) {
//     const err = new Error('Missing `title` in request body');
//     err.status = 400;
//     return next(err);
//   }
//
//   notes.create(newItem)
//     .then(item => {
//       if (item) {
//         res.location(`http://${req.headers.host}/notes/${item.id}`).status(201).json(item);
//       }
//     })
//     .catch(err => {
//       next(err);
//     });
// });

router.post('/', (req, res, next) => {
  const { title, content } = req.body;

  const newItem = { title, content };

  if (!newItem.title) {
      const err = new Error('Missing `title` in request body');
      err.status = 400;
      return next(err);
  }

  knex('notes')
    .insert(newItem)
    .returning(['id', 'title', 'content'])
    .then(note => {
      res.location(`http://${req.headers.host}/notes/${note[0].id}`).status(201).json(note[0]);
    })
    .catch((err => {
      console.error(err)
    }));
});

// Delete an item------------------------------------------OLD VERSION
// router.delete('/:id', (req, res, next) => {
//   const id = req.params.id;
//
//   notes.delete(id)
//     .then(() => {
//       res.sendStatus(204);
//     })
//     .catch(err => {
//       next(err);
//     });
// });
//
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .where('id', `${id}`)
    .del()
    .then(note => {
      res.json(note).status(204)
    })
    .catch((err => {
      console.error(err)
    }));
})

module.exports = router;
