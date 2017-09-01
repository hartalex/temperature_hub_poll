FROM mhart/alpine-node:7.5
RUN mkdir /root/temperature_hub_poll
COPY . /root/temperature_hub_poll/
WORKDIR /root/temperature_hub_poll
RUN echo "* * * * *  node /root/temperature_hub_poll/main.js >> /var/log/tp.log 2>&1 " >> /etc/crontabs/root
RUN npm install
EXPOSE 80
ENTRYPOINT ["crond", "-f"]
