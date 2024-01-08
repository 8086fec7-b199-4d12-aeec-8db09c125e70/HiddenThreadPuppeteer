# Get keys

GET /get_keys
Touch "Сгенерировать ключи" button. Returns sender private and public key

Response
HTTP/1.1 200 OK

```json
{
  "privateKey": "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
  "publicKey": "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
}
```

# Decode image

POST /decode
Touch "Декодировать" button. Returns available hidden post info

Request:
POST /decode HTTP/1.1
content-type: multipart/form-data

|        Field       |  Value |
|:------------------:|:------:|
|      password      | String |
| receiver.PublicKey | String |
|   container.file   |  File  |

Response
HTTP/1.1 200 OK

```json
{
	"text": "Hidden Post",
	"date": "Дата создания скрытопоста (UTC): 2020-01-01 00:00:00",
	"images": [
      "data:image/png;base64,"
    ]
}
```

# Encode Image
GET /encode
Touch "Создать картинку со скрытопостом" button. Returns picture with encoded data

Request:
POST /decode HTTP/1.1
content-type: multipart/form-data

|        Field       |  Value |
|:------------------:|:------:|
|      password      | String |
|      post.text     | String |
|     post.files     |  File  |
|   container.file   |  File  |
| container.autosize | String |
|  sender.PrivateKey | String |
|  sender.PublicKey  | String |
| receiver.PublicKey | String |

Response:
HTTP/1.1 200 OK
content-type: image/png

BINARY BODY
