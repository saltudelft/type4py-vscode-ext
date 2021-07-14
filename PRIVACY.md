# Privacy
We do respect our users' privacy and want to clarify that:
- We do NOT store private code on our server.
- We do NOT store any personal information from users such as location, system info, usage stats, coding preferences, etc.

With regards to the above-defined statements, to improve our Type4Py model and conduct research, we collect two kinds of telemetry data which are described below.

# Telemetry
## Prediction requests:
  - Hashed IP addresses: Helps to uniquely identify prediction requests and active users. Note that a hashed IP cannot be decoded and makes users anonymous.
  - Session ID: Helps to relate prediction requests to the accepted types if shared.
  - Start and finish time for prediction requests which helps us measure the performance of the Type4Py model and its pipeline for future improvements.
  - Errors/Exceptions that occur at the server-side. It helps to solve issues related to our pipeline and deliver a better user experience.
  - Extracted features: This is a JSON object containing type hints that are used for querying the Type4Py model. Note that the JSON object does NOT contain complete source code that can be run or re-used. The extracted features are stored solely for research and improving the model's prediction quality.

## Accepted type predictions:
**NOTE: We gather the following data if the VSCode telemetry is enabled. If not, we explicitly ask users whether they want to share the below data.**
  - Accepted type: Stores the accepted predicted type by the user among the list of predictions. This helps us improve our Type4Py model's predictions.
  - Rank: The rank of the accepted type by the user.
  - Type slot: The accepted type belongs to one of these: Parameters, Return types, or variables.
  - Identifier names for which a predicted type is accepted. In the future, they might be used to improve the model's predictions based on accepted types.
  - Identifiers' line number: It can be used to locate identifiers in the JSON object of extracted features.
  - Filtered predictions: Whether the predictions filtering setting is enabled.
  - Timestamp: The date of inserted records