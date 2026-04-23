@load base/protocols/conn
@load base/protocols/dns
@load base/protocols/http
@load base/protocols/ssl
@load base/protocols/ssh
@load base/protocols/ftp
@load base/frameworks/notice
@load policy/tuning/json-logs

redef LogAscii::use_json = T;
