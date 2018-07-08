'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

const knex = require('../knex');

const hydrateNotes = require('../utils/hydrateNotes');

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
  const { searchTerm, folderId, tagId } = req.query;

  //knex.select('id', 'title', 'content') - Pre folders.js
  knex.select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
    .from('notes')
    //Adding the leftJoin!
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    //Adding another if clause here for folders
    .modify(function (queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
    .modify(function (queryBuilder) {
      if (tagId) {
        queryBuilder.where('tag_id', tagId);
      }
    })
    .orderBy('notes.id')
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated[0]);
      } else {
        next();
      }
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
  const { id } = req.params;

  knex
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .modify(function (queryBuilder) {
      if (id) {
        queryBuilder.where('notes.id', `${id}`)
      }
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Put update an item-------------------------------OLD VERSION
// router.put('/:id', (req, res, next) => {
//   const id = req.params.id;
//
//   /***** Never trust users - validate input *****/
//   const updateObj = {};
//   const updateableFields = ['title', 'content'];
//
//   updateableFields.forEach(field => {
//     if (field in req.body) {
//       updateObj[field] = req.body[field];
//     }
//   });
//
//   /***** Never trust users - validate input *****/
//   if (!updateObj.title) {
//     const err = new Error('Missing `title` in request body');
//     err.status = 400;
//     return next(err);
//   }
//
//   notes.update(id, updateObj)
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

router.put('/:id', (req, res, next) => {
  const { id } = req.params;

  /***** Never trust users - validate input *****/
  const { title, content, folderId, tags } = req.body;
  const updateObj = { title, content, folder_id: folderId };

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
    .where('id', id)
    .update(updateObj)
    .then(() => {
      return knex
        .from('notes_tags')
        .where('note_id', id)
        .del();
    })
    .then(() => {
      const tagsInsert = tags.map(tagId => ({ note_id: id, tag_id: tagId.id }));
      return knex
        .insert(tagsInsert)
        .into('notes_tags');
    })
    .then((...args) => {
      console.log('after update', args)
      return knex
        .select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', id);
    })
    .then(result => {
      if (result[0]) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated[0]);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
})

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
  const { title, content, folderId, tags = [] } = req.body;

  const newItem = {
    title: title,
    content: content,
    folder_id: folderId
  };

  if (!newItem.title) {
      const err = new Error('Missing `title` in request body');
      err.status = 400;
      return next(err);
  }
  let noteId;
  knex('notes')
    .insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      return knex.select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result)[0];
          res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch((err => {
      next(err);
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
      res.json(note).status(204).send('DELETED NOTE');
    })
    .catch((err => {
      console.error(err);
    }));
})

module.exports = router;
