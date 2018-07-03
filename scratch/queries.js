'use strict';

const knex = require('../knex');

let searchTerm = 'gaga';

//GET ALL NOTES THAT ACCEPT A SEARCH TERM
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });

//GET NOTES BY ACCEPTING AN ID

knex
  .first('id', 'title', 'content')
  .from('notes')
  .where('id', 1000)
  .then(note => {
    console.log(note)
  })
  .catch((err => {
    console.error(err)
  }));

//UPDATE NOTES

knex('notes')
  .update('title', '7 things lady gaga has in common with dogs')
  .where('id', 1003)
  .then(note => {
    console.log(note)
    console.log('Status 200 - OK')
  })
  .catch((err => {
    console.error(err)
  }));
