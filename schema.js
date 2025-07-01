const Joi =require("joi");

let validationSchema=Joi.object({
    title:Joi.string().required(),
    description:Joi.string().required(),
    image:Joi.string().allow("",null),
    price:Joi.number().required().min(0),
    country:Joi.string().required(),
    location:Joi.string().required(),
    category:Joi.string().required(),
})

let reviewValidation=Joi.object({
    comment:Joi.string().required(),
    rating:Joi.number().min(1).max(5),
})

module.exports={validationSchema,reviewValidation};