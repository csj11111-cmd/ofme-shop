const handleUserError = (error, res, fallbackMessage) => {
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((err) => err.message)
      .join(', ');

    return res.status(400).json({ message });
  }

  return res.status(500).json({ message: fallbackMessage });
};

module.exports = handleUserError;
