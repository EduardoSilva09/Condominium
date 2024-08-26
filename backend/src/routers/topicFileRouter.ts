import { Router } from "express";
import topicFileController from "../controller/topicFileController";
import { onlyCounselor, onlyManager } from '../middlewares/authorizationMiddleware'

const router = Router();
router.get('/:hash/:fileName', topicFileController.getTopicFile)
router.get('/:hash/', topicFileController.getTopicFiles)
router.post('/:hash', onlyCounselor, topicFileController.addTopicFile)
router.delete('/:hash/:fileName', onlyManager, topicFileController.deleteTopicFile)
router.delete('/:hash/', onlyManager, topicFileController.deleteAllTopicFiles)

export default router;