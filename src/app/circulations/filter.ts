export const FILTER = {
  "start": 0,
  "end": 10000,
  "filter": {
    "conditions": [
      {
        "condition": {
          "field": "applicationDay",
          "operator": "EQUALS",
          "value": "1690243200000"
        }
      },
      {
        "condition": {
          "field": "planned",
          "operator": "EQUALS",
          "value": true
        }
      }
    ]
  },
  "order": [
    {
      "field": "originNumber",
      "dir": "ASC"
    }
  ]
};
