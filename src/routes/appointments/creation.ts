import appointmentService from '@services/appointment.service';
import emailService from '@services/email.service';
import { Request, Response } from 'express';
import { Appointment } from '@schemas/appointment.schema';

import { toMongoHour } from '@utils/time';

export const addNewAppointmentRoute = async (req: Request, res: Response) => {
  console.log(req.body);

  try {
    // year, month, day
    const dateData = req.body.date.split('-');
    // hour, minute, meridiem
    const timeData = req.body.time.split('-');
    const mongoHour = toMongoHour(timeData[0], timeData[2]);
    if (!mongoHour) {
      return res.json({success: false, msg: 'Time data is incorrect...'});
    }
    req.body.date = new Date(dateData[0], dateData[1], dateData[2], mongoHour, timeData[1]);
    const newAppointment = new Appointment(req.body);

    const savedAppointment = await appointmentService.saveModel(newAppointment);
    if (savedAppointment) {
      let body = savedAppointment.description ? savedAppointment.description : 'No description';
      body += `\n\n Message back at ${newAppointment.email}`;
      await emailService.sendMail(`New Appointment - ${savedAppointment.author}`, body);
      return res.json({success: true, msg: 'Successfully added news article', payload: newAppointment});
    } else {
      return res.json({success: false, msg: 'Could not add person...'});
    }
  } catch {
    return res.json({success: false, msg: 'Could not add person...'});
  }

};
