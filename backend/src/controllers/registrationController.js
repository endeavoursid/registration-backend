import sql from "mssql";
import { getPool } from "../db/index.js";
import { sendJson } from "../utils/sendJson.js";

/* ======================================================
   SAVE REGISTRATION (PUBLIC API)
====================================================== */
export async function saveRegistration(req, res) {
  let transaction;

  try {
    const { event_id, attending = [], might = [], cant = [] } = req.body;
    console.log("Registration received for event:", event_id, "| counts:", attending.length, might.length, cant.length);
    const eventId = Number(event_id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return sendJson(res, 400, { error: "Invalid event_id" });
    }

    const allowedTypes = ["attending", "might", "cant"];
const nameRegex = /^[A-Za-z\u0600-\u06FF\s'’‘-]{2,120}$/u;
const phoneRegex = /^\+?[1-9][0-9\s()-]{6,19}$/; // 7–20 chars approx, no junk allowed

const validateMember = (m) => {
  if (!m || typeof m.name !== "string" || typeof m.phone !== "string") return false;
  const name = m.name.trim();
  const phone = m.phone.trim();
  if (name.length < 2 || name.length > 120) return false;
  if (phone.length < 7 || phone.length > 20) return false;
  return nameRegex.test(name) && phoneRegex.test(phone);
};

// Validate each attendance list separately BEFORE spreading types
for (const m of attending) if (!validateMember(m)) return sendJson(res, 400, { error: "Invalid attending member" });
for (const m of might) if (!validateMember(m)) return sendJson(res, 400, { error: "Invalid might-attend member" });
for (const m of cant) if (!validateMember(m)) return sendJson(res, 400, { error: "Invalid cant-attend member" });

// Validate attendance arrays size
if (attending.length > 10 || might.length > 10 || cant.length > 1) {
  return sendJson(res, 400, { error: "Member count exceeds allowed limit" });
}

    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    const request = transaction.request();

    const regResult = await request
      .input("eventId", sql.Int, eventId)
      .input("attCount", sql.Int, attending.length)
      .input("mightCount", sql.Int, might.length)
      .input("cant", sql.Bit, cant.length > 0)
      .query(`
        INSERT INTO autozone.dbo.registrations
          (event_id, attending_count, might_attend_count, cant_attend)
        OUTPUT INSERTED.id
        VALUES
          (@eventId, @attCount, @mightCount, @cant)
      `);

    const registrationId = regResult.recordset[0].id;

    const allMembers = [
      ...attending.map(m => ({...m, type:"attending"})),
      ...might.map(m => ({...m, type:"might"})),
      ...cant.map(m => ({...m, type:"cant"})),
    ];

    for (const m of allMembers) {
  if (!allowedTypes.includes(m.type)) {
    await transaction.rollback();
    return sendJson(res, 400, { error: "Invalid attendance type" });
  }
  if (!validateMember(m)) {
    await transaction.rollback();
    return sendJson(res, 400, { error: "Invalid name or phone format" });
  }

  // Fresh request each time, unique param names, correct bindings
  await transaction.request()
    .input("regId", sql.Int, registrationId)
    .input("attendanceType", sql.VarChar(20), m.type)
    .input("fullName", sql.NVarChar(150), m.name.trim())
    .input("phone", sql.VarChar(30), m.phone.trim())
    .query(`
      INSERT INTO autozone.dbo.registration_members
        (registration_id, attendance_type, full_name, phone)
      VALUES
        (@regId, @attendanceType, @fullName, @phone)
    `);
}

    await transaction.commit();
    return sendJson(res, 201, { message: "Registration saved", registration_id: registrationId });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("SAVE REGISTRATION ERROR:", err.message);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}


/* ======================================================
   GET ALL REGISTRATIONS (ADMIN)
====================================================== */
export async function getRegistrations(req, res) {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        id,
        event_id,
        attending_count,
        might_attend_count,
        cant_attend,
        created_at
      FROM registrations
      ORDER BY created_at DESC
    `);

    return sendJson(res, 200, result.recordset);

  } catch (err) {
    console.error("GET REGISTRATIONS ERROR:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

/* ======================================================
   GET REGISTRATION DETAILS (ADMIN)
====================================================== */
export async function getRegistrationDetails(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const idParam = url.searchParams.get("id");

    const regId = Number(idParam);
    if (!Number.isInteger(regId) || regId <= 0) {
      return sendJson(res, 400, { error: "Invalid registration id" });
    }

    const pool = await getPool();

    const regResult = await pool
      .request()
      .input("id", sql.Int, regId)
      .query(`
        SELECT
          id,
          event_id,
          attending_count,
          might_attend_count,
          cant_attend,
          created_at
        FROM registrations
        WHERE id = @id
      `);

    if (regResult.recordset.length === 0) {
      return sendJson(res, 404, { error: "Registration not found" });
    }

    const membersResult = await pool
      .request()
      .input("id", sql.Int, regId)
      .query(`
        SELECT
          attendance_type,
          full_name,
          phone
        FROM registration_members
        WHERE registration_id = @id
        ORDER BY id ASC
      `);

    return sendJson(res, 200, {
      registration: regResult.recordset[0],
      members: membersResult.recordset,
    });

  } catch (err) {
    console.error("GET REGISTRATION DETAILS ERROR:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}
