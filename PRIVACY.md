# Privacy
We do respect our users' privacy and want to clarify that:
- We do NOT store private code on our server.
- We do NOT store any personal information from users such as location, system info, usage stats, coding preferences, etc.

With regards to the above-defined statements, to improve our Type4Py model and conduct research, we collect two kinds of telemetry data which are described below.

# Telemetry
## Prediction requests:
  - Hashed IP addresses: Helps to uniquely identify prediction requests and active users. Note that a hashed IP cannot be decoded and makes users anonymous.
  - Start and finish time for prediction requests which helps us measure the performance of the Type4Py model and its pipeline for future improvements.
  - Errors/Exceptions that occur at the server-side. It helps to solve issues related to our pipeline and deliver a better user experience.

## Accepted type predictions:
**NOTE: We gather the following data if the VSCode telemetry is enabled. If not, we explicitly ask users whether they want to share the below data.**
  - Accepted type: Stores the accepted predicted type by the user among the list of predictions. This helps us improve our Type4Py model's predictions.
  - Rank: The rank of the accepted type by the user.
  - Type slot: The accepted type belongs to one of these: Parameters, Return types, or variables.
  - Filtered predictions: Whether the predictions filtering setting is enabled.
  - Timestamp: The date of inserted records