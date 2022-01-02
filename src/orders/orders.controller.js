const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId"); // Use this function to assigh ID's when necessary

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order does not exist: ${orderId}` });
}

function orderMatchesRoute(req, res, next) {
  const orderId = req.params.orderId;
  const {
    data: { id },
  } = req.body;
  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function checkStatus(req, res, next) {
  const { data: order } = req.body;

  if (!order.status || order.status.length < 1 || order.status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  if (order.status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be changed" });
  }
  next();
}

function hasDeliverTo(req, res, next) {
  const { data: order } = req.body;
  const deliverTo = order.deliverTo;
  if (deliverTo && deliverTo.length > 0) {
    return next();
  }
  next({ status: 400, message: "Order must include a deliverTo" });
}

function hasMobileNumber(req, res, next) {
  const { data: order } = req.body;
  const mobileNumber = order.mobileNumber;
  if (mobileNumber && mobileNumber.length > 0) {
    return next();
  }
  next({ status: 400, message: "Order must include a mobileNumber" });
}

function hasDishes(req, res, next) {
  const { data: order } = req.body;
  const dishes = order.dishes;
  if (!dishes) {
    return next({ status: 400, message: "Order must include a dish" });
  }
  if (!Array.isArray(dishes) || dishes.length < 1) {
    next({ status: 400, message: "Order must include at least one dish" });
  }
  next();
}

function hasDishQuantities(req, res, next) {
  const { data: order } = req.body;
  const dishes = order.dishes;
  const haveQuantities = dishes.every((dish) => dish.quantity);
  const moreThanZero = dishes.every((dish) => dish.quantity > 0);
  const anInteger = dishes.every((dish) => Number.isInteger(dish.quantity));

  if (!haveQuantities) {
    const index = dishes.findIndex((dish) => !dish.quantity);
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  if (!moreThanZero) {
    const index = dishes.findIndex((dish) => dish.quantity < 1);
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  if (!anInteger) {
    const index = dishes.findIndex((dish) => !Number.isInteger(dish.quantity));
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  return next();
}

function list(req, res) {
  const IdRoute = req.params.id;
  const filteredOrders = orders.filter(
    (order) => !IdRoute || order.id == Number(IdRoute)
  );
  res.json({ data: filteredOrders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const id = res.locals.order.id;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const updatedOrder = {
    id: id,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  res.json({ data: updatedOrder });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const order = res.locals.order;
  if (order.status !== "pending") {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  const index = orders.findIndex((order) => order.id === Number(orderId));
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [hasDeliverTo, hasMobileNumber, hasDishes, hasDishQuantities, create],
  read: [orderExists, read],
  update: [
    orderExists,
    orderMatchesRoute,
    checkStatus,
    hasDeliverTo,
    hasMobileNumber,
    hasDishes,
    hasDishQuantities,
    update,
  ],
  delete: [orderExists, destroy],
};
