import { Router } from "express";
import residentController from "../controller/residentController";

const router = Router();
router.get('/:wallet', residentController.getResident)
router.post('/', residentController.postResident)
router.patch('/:wallet', residentController.patchResident)
router.delete('/:wallet', residentController.deleteResident)

export default router;