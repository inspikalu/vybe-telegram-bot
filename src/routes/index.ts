const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
  res.send('API is running');
});

module.exports = router;
