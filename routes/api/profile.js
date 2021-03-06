const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Profile = require('../../models/profile');
const User = require('../../models/user');
const validateProfileInput = require('../../validation/profile')
const valedateExperienceInput = require('../../validation/experience')
const valedateEducationInput = require('../../validation/education')

router.get('/test', (req, res) => res.json({ message: "Profile Working" }));

router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    const errors = {};

    Profile.findOne({ user: req.user.id })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if (!profile) {
                errors.profile = 'Профиль не найден'
                return res.status(404).json(errors)
            }
            res.json(profile)
        })
        .catch(err => res.status(404).json(err));
})

router.get('/handle/:handle', (req, res) => {
    const errors = {}

    Profile.findOne({ handle: req.params.handle })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'Профайл пользователя не найден'
                res.status(404).json(errors)
            }
            res.json(profile)
        })
        .catch(err => console.log(err))
})

router.get('/user/:user_id', (req, res) => {
    const errors = {}

    Profile.findOne({ user: req.params.user_id })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'Профайл пользователя не найден'
                res.status(404).json(errors)
            }
            res.json(profile)
        })
        .catch(err => console.log(err))
})

router.get('/all', (req, res) => {
    const errors = {}
    Profile.find()
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if (!profile) {
                errors.noProfiles = 'Профайлы не найдены'
                res.status(404).json(errors)
            }
            res.json(profile)
        })
        .catch(err => res.status(404).json(err))
})

router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    const profileFields = {};
    profileFields.user = req.user.id

    const { errors, isValid } = validateProfileInput(req.body)

    if (!isValid) {
        return res.status(400).json(errors)
    }

    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githhub) profileFields.githhub = req.body.githhub;

    if (typeof req.body.skills !== 'undefined') {
        profileFields.skills = req.body.skills.split(',');
    }

    profileFields.social = {};
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if (profile) {
                Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                )
                    .then(profile => res.json(profile));
            }
            else {
                Profile.findOne({ handle: profileFields.handle })
                    .then(profile => {
                        if (profile) {
                            errors.handle = 'Этот файл уже существует';
                            res.status(400).json(errors)
                        }
                        new Profile(profileFields)
                            .save()
                            .then(profile => res.json(profile))
                    })
            }
        })

})

router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = valedateExperienceInput(req.body)

    if (!isValid) {
        return res.status(400).json(errors)
    }
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            const newExp = {
                title: req.body.title,
                company: req.body.company,
                location: req.body.location,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                discriptions: req.body.discriptions
            }
            profile.experience.unshift(newExp)
            profile
                .save()
                .then(profile => res.json(profile))
        })
})

router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = valedateEducationInput(req.body)

    if (!isValid) {
        return res.status(400).json(errors)
    }
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            const newEdc = {
                school: req.body.school,
                degree: req.body.degree,
                fieldofstudy: req.body.fieldofstudy,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                discriptions: req.body.discriptions
            }
            profile.education.unshift(newEdc)
            profile
                .save()
                .then(profile => res.json(profile))
        })
})

router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            const removeIndex = profile.experience
            .map(item => item.id)
            .indexOf(req.params.exp_id)
            console.log(profile.experience)
            profile.experience.splice(removeIndex, 1)
            profile.save().then(profile => res.json(profile))
        })
        .catch(err => res.status(400).json(err))
})

router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            console.log(profile)
            const removeIndex = profile.education
            .map(item => item.id)
            .indexOf(req.params.edu_id)
            console.log(profile.education)
            profile.education.splice(removeIndex, 1)
            profile.save().then(profile => res.json(profile))
        })
        .catch(err => res.status(400).json(err))
})

router.delete('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    Profile.findOneAndRemove({user: req.user.id})
    .then(() => {
        User.findOneAndRemove({_id: req.user.id})
        .then(() => {
            res.json({success: true})
        })
    })
})

module.exports = router;