const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId"); //// Use this function to assign ID's when necessary

//VALIDATION//
function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}` });
}

function dishMatchesRoute(req, res, next) {
  const dishId = req.params.dishId;
  const {
    data: { id },
  } = req.body;
  if (id && id !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function hasName(req, res, next) {
  const {
    data: { name },
  } = req.body;
  if (name && name.length > 0) {
    return next();
  }
  next({ status: 400, message: `Dish must include a name` });
}

function hasDescription(req, res, next) {
  const {
    data: { description },
  } = req.body;
  if (description && description.length > 0) {
    return next();
  }
  next({ status: 400, message: `Dish must include a description` });
}

function hasPrice(req, res, next) {
  const {
    data: { price },
  } = req.body;
  if (!price) {
    return next({ status: 400, message: `Dish must include a price` });
  } else if (price < 1 || !Number.isInteger(price)) {
    next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  } else {
    next();
  }
}

function hasImage(req, res, next) {
  const {
    data: { image_url },
  } = req.body;
  if (image_url && image_url.length > 0) {
    return next();
  }
  next({ status: 400, message: `Dish must include a image_url` });
}

//REQUESTS//
function list(req, res, next) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const id = res.locals.dish.id;
  const { data: { name, description, price, image_url } = {} } = req.body;
  const updatedDish = {
    id: id,
    name,
    description,
    price,
    image_url,
  };
  res.json({ data: updatedDish });
}

module.exports = {
  list,
  create: [hasName, hasDescription, hasPrice, hasImage, create],
  read: [dishExists, read],
  update: [
    dishExists,
    dishMatchesRoute,
    hasName,
    hasDescription,
    hasPrice,
    hasImage,
    update,
  ],
};
