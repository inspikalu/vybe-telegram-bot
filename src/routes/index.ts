const express = require('express');
const { Router } = express;
const router = Router();

router.get('/', (req: import('express').Request, res: import('express').Response) => {
  res.send('API is running');
});

module.exports = router;
