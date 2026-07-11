# Transactional email
sendTransactionalEmail(type, payload) wrapping Resend/SMTP. Failures are
caught and logged here -- never allowed to fail the order transaction that
triggered them.
