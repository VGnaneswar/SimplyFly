using AutoMapper;
using SimplyFly.API.DTOs;
using SimplyFly.API.Models;

namespace SimplyFly.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<RegisterUserDto, User>();

            CreateMap<AddFlightDto, Flight>();

            CreateMap<BookFlightDto, Booking>();

            CreateMap<MakePaymentDto, Payment>();
        }
    }
}